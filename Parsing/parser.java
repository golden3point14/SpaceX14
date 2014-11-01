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
			if (!seenTasks.containsKey(pid)) {
				// Create new task object
				task = new JSONObject();
				task.put("name", name);
				task.put("pid", pid);
				JSONArray taskEvents = new JSONArray();
				taskEvents.add(currentLine);
				task.put("events", taskEvents);
				task.put("preemptionCount", 0);
				
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
		
		mainObj.put("events", events);
		mainObj.put("tasks", tasks);
		
		FileWriter file = new FileWriter("test.json");
		file.write(JSONValue.toJSONString(mainObj));
		file.flush();
		file.close();
	}
	
	
}