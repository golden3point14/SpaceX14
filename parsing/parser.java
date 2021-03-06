import java.io.BufferedReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;

class parser {
	public static HashMap<Integer,Integer> pidToTaskIndex = new HashMap<Integer, Integer>();
	
	public static void main(String [ ] args) throws IOException, InterruptedException {
		Runtime rt = Runtime.getRuntime();
		
		// If an argument is provided, attempt to use generate a report from it with trace-cmd report
		// Otherwise just run trace-cmd report, which will look for a file called trace.dat
		Process proc;
    String filename = "trace.dat";
		if (args.length > 0) {
      filename = args[0];
			File f = new File(filename);
			if (f.exists() && !f.isDirectory()) {
				String command = "trace-cmd report " + filename;
				proc = rt.exec(command);
			} else {
				System.out.println("Please provide a valid filename.");
				return;
			}
		} else {	
			proc = rt.exec("trace-cmd report ");
		}
	
		BufferedReader stdInput = new BufferedReader(new InputStreamReader(proc.getInputStream()));
		String s = null;
		String[] tokens;
		HashMap<Integer, JSONObject> seenTasks = new HashMap<Integer, JSONObject>();
		HashMap<String, JSONObject> seenEventTypes = new HashMap<String, JSONObject>();
		HashMap<String, JSONObject> seenNames = new HashMap<String, JSONObject>();
		
		// First line in report is of format
		// version = x
		if ((s = stdInput.readLine()) != null) {
			tokens = s.split("\\s+");
		}
		
		// Second line in report is of format
		// cpus=x
		int numCPUs = 0;
		if ((s = stdInput.readLine()) != null) {
			tokens = s.split("=");
			if (tokens.length == 2) {
				numCPUs = Integer.parseInt(tokens[1]);
			}
		}
		
		JSONObject mainObj = new JSONObject();
		JSONArray events = new JSONArray();
		JSONArray tasks = new JSONArray();
		int currentLine = 0;
		int numTasks = 0;
		JSONArray autocompleteEventTypes = new JSONArray();
		JSONArray autocompleteNames = new JSONArray();
		JSONArray cycleEvents = new JSONArray();
		
		// Within the rest of the file, lines will roughly be of the format
		// trace-cmd-28911 [001]  6340.460348: sched_wakeup:         28911:?:? +   28911:120:? trace-cmd [001] Success
		// name-pid [cpu] startTime: eventType: extraInfoBasedOnEventType
		while ((s = stdInput.readLine()) != null) {

			s = s.trim();
			tokens = s.split("\\s+");
			try {
				// Break the first token, name-pid, on the last hyphen as name itself may contain hyphens
				// and then grab the name and pid
				int splitIndex = tokens[0].lastIndexOf('-');
				String name = tokens[0].substring(0, splitIndex);
				int pid = Integer.parseInt(tokens[0].substring(splitIndex+1));
				
				// Remove brackets around CPU
				int cpu = Integer.parseInt(tokens[1].substring(1,tokens[1].length()-1));
				
				// Remove the colon at end of start time, then parse to a double
				double startTime = Double.parseDouble(tokens[2].substring(0, tokens[2].length()-1));
				
				// Remove the colon at the end of eventType
				String eventType = tokens[3].substring(0, tokens[3].length()-1);
				
				// Join together the rest that was split on spaces before to form extraInfo
				String extraInfo = tokens[4];
				for (int i=5; i<tokens.length; i++)
				{
					extraInfo += " " + tokens[i]; 
				}
				
				// Create a JSON representation of this event and add to our events array
				JSONObject event = new JSONObject();
				event.put("name", name);
				event.put("pid", pid);
				event.put("cpu", cpu);
				event.put("startTime", startTime);
				event.put("eventType", eventType);
				event.put("extraInfo", extraInfo);
				events.add(event);
				
				// Check to see if we have already created a task associated with this pid
				// Either make a new one or look it up and append this event to its event list
				JSONObject task;

				if (!seenTasks.containsKey(pid)) {
					// Create new task object
					task = new JSONObject();
					task.put("name", name);
					task.put("pid", pid);
					JSONArray preemptedByTasks = new JSONArray();
					task.put("preemptedBy", preemptedByTasks);
					task.put("preemptionCount", 0);
					task.put("totalRuntime", 0l);
					task.put("totalWaittime", 0l);
					task.put("totalSleeptime", 0l);
					
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
				}

				JSONObject autocompleteEventType;
				if (!seenEventTypes.containsKey(eventType)) {
					autocompleteEventType = new JSONObject();
					autocompleteEventTypes.add(eventType);
					seenEventTypes.put(eventType, autocompleteEventType);
				}

				JSONObject autocompleteName;
				if (!seenNames.containsKey(name)) {
					autocompleteName = new JSONObject();
					autocompleteNames.add(name);
					seenNames.put(name, autocompleteName);
				}
				
				//EXAMPLE prev_comm=swapper/1 prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=irq/53-msg_tx next_pid=375 next_prio=39
				if (eventType.equals("sched_switch")) {
					String[] switchInfo = extraInfo.split("\\s==>\\s");
					
					String[] previousTaskInfo = switchInfo[0].split(" ");
					String[] nextTaskInfo = switchInfo[1].split(" ");

          			// If the previous state was runnable, then the switch is a preemption
          			char lastChar = previousTaskInfo[3].charAt(previousTaskInfo[3].length() - 1);
				
					String nextName = nextTaskInfo[0].split("=")[1];
					String nextPID = nextTaskInfo[1].split("=")[1];
				
					if ((lastChar == 'R') || (lastChar == '+')) {
						JSONArray preemptedByTasks = (JSONArray)(task.get("preemptedBy"));
						preemptedByTasks.add(nextName);
						// System.out.println(preemptedBy);
						task.put("preemptedBy", preemptedByTasks);

						event.put("preempted", true);
						int preemptCount = (Integer)(task.get("preemptionCount"));
						preemptCount++;
						task.put("preemptionCount", preemptCount);
						
					} else {
						event.put("preempted", false);
					}
					event.put("activeName", nextName);
					event.put("activePID", nextPID);
					
				}
				
				//EXAMPLE: c0095a18 CYCLE_START: sync_time=728.3360000
				if  (eventType.equals("print"))
				{
					String[] info = extraInfo.split(" ");
					
					if (info[1].equals("CYCLE_START:"))
					{
						JSONObject startCycles = new JSONObject();
						startCycles.put("startTime", startTime);
						startCycles.put("extraInfo", extraInfo);
						cycleEvents.add(startCycles);
					}
				}
				
				currentLine += 1;
			
			} catch (Exception e){
				System.out.printf("Unable to parse line: %s\n", s);
			}
		}
		calculateTotalRunTimeOfEachTask(events, tasks);

    // Currently not displayed in the application
		//calculateTotalWaitTimeOfEachTask(events, tasks);
		//calculateTotalSleepTimeOfEachTask(events, tasks);

		calculateDurationOfEvent(events);
		
		mainObj.put("events", events);
		mainObj.put("tasks", tasks);
		mainObj.put("numCPU", numCPUs); //wbrooks
		mainObj.put("autocompleteEventTypes", autocompleteEventTypes);		
		mainObj.put("autocompleteNames", autocompleteNames);
		mainObj.put("cycleEvents", cycleEvents);


		writeJSON(mainObj, filename);
	}
	
	public static void writeJSON(JSONObject obj, String filename) throws IOException {
    // A filename something.dat should have .dat removed so it can be written to something.json
		FileWriter file = new FileWriter(filename.substring(0, filename.length() - 4) + ".json");
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
			// Interested in value after runtime\
			try {
				if (event.get("eventType").equals("sched_stat_runtime")) {
				
					String[] runtimeInfo = ((String) event.get("extraInfo")).split("\\s");
					Long runtime = Long.parseLong(runtimeInfo[2].substring(runtimeInfo[2].indexOf('=') + 1));

					int index = (Integer) pidToTaskIndex.get((Integer) event.get("pid"));
					JSONObject associatedTask = (JSONObject) tasks.get(index);
				
					Long total = (Long) associatedTask.get("totalRuntime");
					runtime += total;
				
					associatedTask.put("totalRuntime", runtime);
				}
			} catch (Exception e) {
				System.out.println("Unable to parse runtime for event: " + JSONValue.toJSONString(event));
			}
		}
	}
	
	public static void calculateTotalWaitTimeOfEachTask(JSONArray events, JSONArray tasks) {
		int numEvents = events.size();
		for (int i = 0; i < numEvents; i++) {
			JSONObject event = (JSONObject) events.get(i);
			
			// Example of wait info formatting
			// comm=trace-cmd pid=8905 delay=1051505 [ns]
			try {
				if (event.get("eventType").equals("sched_stat_wait")) {
				
					String[] waittimeInfo = ((String) event.get("extraInfo")).split("\\s");
					Long waittime = Long.parseLong(waittimeInfo[2].substring(waittimeInfo[2].indexOf('=') + 1));
				
					int index = (Integer) pidToTaskIndex.get((Integer) event.get("pid"));
					JSONObject associatedTask = (JSONObject) tasks.get(index);
				
					Long total = (Long) associatedTask.get("totalWaittime");
					waittime += total;
	
					associatedTask.put("totalWaittime", waittime);
				}
			} catch (Exception e) {
				System.out.println("Unable to parse waittime for event: " + JSONValue.toJSONString(event));
			}
		}
	}
	
	public static void calculateTotalSleepTimeOfEachTask(JSONArray events, JSONArray tasks) {
		int numEvents = events.size();
		for (int i = 0; i < numEvents; i++) {
			JSONObject event = (JSONObject) events.get(i);
			
			// Same formatting as wait event
			try {
				if (event.get("eventType").equals("sched_stat_sleep")) {
					String[] sleeptimeInfo = ((String) event.get("extraInfo")).split("\\s");
					Long sleeptime = Long.parseLong(sleeptimeInfo[2].substring(sleeptimeInfo[2].indexOf('=') + 1));
				
					int index = (Integer) pidToTaskIndex.get((Integer) event.get("pid"));
					JSONObject associatedTask = (JSONObject) tasks.get(index);
				
					Long total = (Long) associatedTask.get("totalSleeptime");
					sleeptime += total;
					
					associatedTask.put("totalSleeptime", sleeptime);
				}
			} catch (Exception e) {
				System.out.println("Unable to parse waittime for event: " + JSONValue.toJSONString(event));
			}
			
		}
	}
	
	public static void calculateDurationOfEvent(JSONArray events) {
		HashMap<Integer, List<JSONObject>> cpuGrouped = new HashMap<Integer, List<JSONObject>>();
		int len = events.size();
		for (int i = 0; i < len; i++) {
			JSONObject event = (JSONObject) events.get(i);
			int cpu = (Integer)event.get("cpu");
			if (!cpuGrouped.containsKey(cpu)) {
				List<JSONObject> eventsForCPU = new ArrayList<JSONObject>();
				eventsForCPU.add(event);
				cpuGrouped.put(cpu, eventsForCPU);
			} else {
				cpuGrouped.get(cpu).add(event);
			}
		}
		int numCPUs = cpuGrouped.size();
		for (int cpu = 0; cpu < numCPUs; cpu++) {
			List<JSONObject> eventsForCPU = cpuGrouped.get(cpu);
			int numEventsForCPU = eventsForCPU.size() - 1;
			for (int i = 0; i < numEventsForCPU; i++) {
				JSONObject event1 = eventsForCPU.get(i);
				JSONObject event2 = eventsForCPU.get(i + 1);
				double duration = (Double)event2.get("startTime") - (Double)event1.get("startTime");
				event1.put("duration", duration);
			}
			eventsForCPU.get(numEventsForCPU).put("duration", 0);
		}
	}
	
}
