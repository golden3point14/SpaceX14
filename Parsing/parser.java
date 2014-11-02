import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;

class parser {
	public static HashMap pidToTaskIndex = new HashMap();
	
	public static void main(String [ ] args) throws IOException, InterruptedException {
		Runtime rt = Runtime.getRuntime();
		
		Process proc;
		if (args.length > 0) {
			String filename = args[0];
			File f = new File(filename);
			if (f.exists() && !f.isDirectory()) {
				String command = "trace-cmd report " + filename;
				proc = rt.exec(command);
			} else {
				System.out.println("Please provide a valid filename.");
				return;
			}
		} else {	
			proc = rt.exec("trace-cmd report");
		}
	
		BufferedReader stdInput = new BufferedReader(new InputStreamReader(proc.getInputStream()));
		String s = null;
		String[] tokens;
		HashMap seenTasks = new HashMap();
		
		if ((s = stdInput.readLine()) != null) {
			tokens = s.split("\\s+");
		}
		
		if ((s = stdInput.readLine()) != null) {
			tokens = s.split("=");
		}
		JSONObject mainObj = new JSONObject();
		JSONArray events = new JSONArray();
		JSONArray tasks = new JSONArray();
		int currentLine = 0;
		while ((s = stdInput.readLine()) != null) {

			s = s.trim();
			tokens = s.split("\\s+");
			
			int splitIndex = tokens[0].lastIndexOf('-');
			String name = tokens[0].substring(0, splitIndex);
			int pid = Integer.parseInt(tokens[0].substring(splitIndex+1));
			String cpu = tokens[1];
			double startTime = Double.parseDouble(tokens[2].substring(0, tokens[2].length()-1));
			String eventType = tokens[3].substring(0, tokens[3].length()-1);
			
			String extraInfo = tokens[4];
			for (int i=5; i<tokens.length; i++)
			{
				extraInfo += " " + tokens[i]; 
			}
			
			
			JSONObject event = new JSONObject();
			event.put("name", name);
			event.put("pid", pid);
			event.put("cpu", cpu);
			event.put("startTime", startTime);
			event.put("eventType", eventType);
			event.put("extraInfo", extraInfo);
			String jsonText = JSONValue.toJSONString(event);
			events.add(event);
			
			JSONObject task;
			int numTasks = 0;
			if (!seenTasks.containsKey(pid)) {
				// Create new task object
				task = new JSONObject();
				task.put("name", name);
				task.put("pid", pid);
				JSONArray taskEvents = new JSONArray();
				taskEvents.add(currentLine);
				task.put("events", taskEvents);
				task.put("preemptionCount", 0);
				
				// Associate PID of task with its index in the task array
				pidToTaskIndex.put(pid, numTasks);
				numTasks += 1;
				
				// Add task to task array
				tasks.add(task);
				
				// Add task to seen tasks
				seenTasks.put(pid, task);
			}
			//we have seen the task before
			//we still need to add an event to it
			else
			{
				task = (JSONObject)seenTasks.get(pid);
				((JSONArray)task.get("events")).add(currentLine);
			}
			
			if (eventType.equals("sched_switch")) {
				String[] switchInfo = extraInfo.split("\\s==>\\s");
				
				String[] previousTaskInfo = switchInfo[0].split(":");
				if (previousTaskInfo[2].equals("R")) {
					event.put("preempted", true);
					int i = switchInfo[1].indexOf(':');
					int preemptingTaskId = Integer.parseInt(switchInfo[1].substring(0,i));
					int preemptCount = (Integer)(task.get("preemptionCount"));
					preemptCount++;
					task.put("preemptionCount", preemptCount);
					
				} else {
					event.put("preempted", false);
				}
			}
			
			
			currentLine += 1;
		}
		calculateTotalRunTimeOfEachTask(events, tasks);
		calculateTotalWaitTimeOfEachTask(events, tasks);
		calculateTotalSleepTimeOfEachTask(events, tasks);
		
		mainObj.put("events", events);
		mainObj.put("tasks", tasks);
		
		writeJSON(mainObj);
	}
	
	public static void writeJSON(JSONObject obj) throws IOException {
		FileWriter file = new FileWriter("test.json");
		file.write(JSONValue.toJSONString(obj));
		file.flush();
		file.close();
	}
	
	// The runtime is in ns
	public static void calculateTotalRunTimeOfEachTask(JSONArray events, JSONArray tasks) {
		int numEvents = events.size();
		for (int i = 0; i < numEvents; i++) {
			JSONObject event = (JSONObject) events.get(i);
			
			// Example formatting of stat_runtime
			// comm=trace-cmd pid=8915 runtime=241034 [ns] vruntime=56595524040767 [ns]
			// Interested in value after runtime
			if (event.get("eventType").equals("sched_stat_runtime")) {
				
				String[] runtimeInfo = ((String) event.get("extraInfo")).split("\\s");
				Long runtime = Long.parseLong(runtimeInfo[2].substring(runtimeInfo[2].indexOf('=') + 1));
				
				int index = (Integer) pidToTaskIndex.get((Integer) event.get("pid"));
				JSONObject associatedTask = (JSONObject) tasks.get(index);
				
				if (associatedTask.containsKey("totalRuntime")) {
					Long total = (Long) associatedTask.get("totalRuntime");
					runtime += total;
				}
				associatedTask.put("totalRuntime", runtime);
			}
		}
	}
	
	public static void calculateTotalWaitTimeOfEachTask(JSONArray events, JSONArray tasks) {
		int numEvents = events.size();
		for (int i = 0; i < numEvents; i++) {
			JSONObject event = (JSONObject) events.get(i);
			
			// Example of wait info formatting
			// comm=trace-cmd pid=8905 delay=1051505 [ns]
			if (event.get("eventType").equals("sched_stat_wait")) {
				
				String[] waittimeInfo = ((String) event.get("extraInfo")).split("\\s");
				Long waittime = Long.parseLong(waittimeInfo[2].substring(waittimeInfo[2].indexOf('=') + 1));
				
				int index = (Integer) pidToTaskIndex.get((Integer) event.get("pid"));
				JSONObject associatedTask = (JSONObject) tasks.get(index);
				
				if (associatedTask.containsKey("totalWaittime")) {
					Long total = (Long) associatedTask.get("totalWaittime");
					waittime += total;
				}
				associatedTask.put("totalWaittime", waittime);
			}
		}
	}
	
	public static void calculateTotalSleepTimeOfEachTask(JSONArray events, JSONArray tasks) {
		int numEvents = events.size();
		for (int i = 0; i < numEvents; i++) {
			JSONObject event = (JSONObject) events.get(i);
			
			// Same formatting as wait event
			if (event.get("eventType").equals("sched_stat_sleep")) {
				
				String[] sleeptimeInfo = ((String) event.get("extraInfo")).split("\\s");
				Long sleeptime = Long.parseLong(sleeptimeInfo[2].substring(sleeptimeInfo[2].indexOf('=') + 1));
				
				int index = (Integer) pidToTaskIndex.get((Integer) event.get("pid"));
				JSONObject associatedTask = (JSONObject) tasks.get(index);
				
				if (associatedTask.containsKey("totalSleeptime")) {
					Long total = (Long) associatedTask.get("totalSleeptime");
					sleeptime += total;
				}
				associatedTask.put("totalSleeptime", sleeptime);
			}
		}
	}
}