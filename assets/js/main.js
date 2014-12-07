var preemptionSorted;
var runTimesorted;
var waitTimesorted;

var JSONobj;

var JSONevents;
var JSONtasks;
var numCPUs;

var files;

var reader = new FileReader(); 

var db;

var SCALE_FACTOR = 100000; // Scales the duration so things are actually visible

function openDB()
{
  var openRequest = indexedDB.open("events", 4);

  openRequest.onupgradeneeded =  function(e)
  {
    console.log("upgrading...");

    var thisDB = e.target.result;

    if (!thisDB.objectStoreNames.contains("Events"))
      {
        thisDB.createObjectStore("Events");
        console.log("created events");
      }

    if (!thisDB.objectStoreNames.contains("Tasks"))
    {
      thisDB.createObjectStore("Tasks");
      console.log("created tasks");
    }

    if (!thisDB.objectStoreNames.contains("numCPUs"))
    {
      thisDB.createObjectStore("numCPUs");
      console.log("created CPUs");
    }
    

  }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    db = e.target.result;

    var xact = db.transaction(["Events"],"readwrite");
    var xact2 = db.transaction(["Tasks"], "readwrite");
    var xact3 = db.transaction(["numCPUs"], "readwrite");
    var store = xact.objectStore("Events");
    var store2 = xact2.objectStore("Tasks");
    var store3 = xact3.objectStore("numCPUs");
    var result = store.get(1);
    var result2 = store2.get(1);
    var result3 = store3.get(1);

    // some kind of error handling
    result.onerror = function(e) {console.log("Error", e.target.error.name);}

    result.onsuccess = function(e) {
                                      JSONevents = e.target.result;
                                      console.log("SIZE OF THING IS " + JSONevents.length);
                                      
                                    //attemptToFormatData();
                                  }

     // some kind of error handling
    result2.onerror = function(e) {console.log("Error", e.target.error.name);}

    result2.onsuccess = function(e) {JSONtasks = e.target.result;
                                      getTopPreemptions();
                                    getTopRuntime();
                                    getTopWaittime();
                                    }

    result3.onerror = function(e) {console.log("Error", e.target.error.name);}

    result3.onsuccess = function(e) {
                                      numCPUs = e.target.result;
                                      console.log("numCPUs is " + numCPUs);
                                    //attemptToFormatData();

                                    // TODO Fix so that numCPU read from JSON
                                    maxDuration = getLongestCPUDuration(numCPUs); //should be numCPU as argument

                                    var gantt = d3.gantt().taskTypes(_.range(numCPUs)).timeDomain(maxDuration);
                                    switchEvents = normalizeStartTime(numCPUs);
                                    
                                    // Scale all durations up
                                    //switchEvents = _.map(switchEvents, function(e){e.duration *= SCALE_FACTOR; return e;})
                                    gantt(switchEvents);
                                    setColoringOfTasks();
    }

  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e); }
}

function setColoringOfTasks() {
  // For each task, create a CSS class with a random color
  for (var i = 0; i < JSONtasks.length; i++) {
    var style = document.createElement('style');
    style.type = 'text/css';
    var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
    style.innerHTML = '.' + JSONtasks[i].pid + ' { color: #' + color + '; }';
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}

function makeRow(task, table, attribute) {
    var row = table.insertRow(2);

    var nameCell = row.insertCell(0);
    nameCell.innerHTML = task.name;

    var pidCell = row.insertCell(1);
    pidCell.innerHTML = task.pid;

    var countCell = row.insertCell(2);
    countCell.innerHTML = task[attribute];
}

function getTopPreemptions()
{

  var displayNum = 10;

	//sort processes by preemptionCount
 	preemptionSorted = _.sortBy(JSONtasks, function(element){return -1*(element.preemptionCount);});
 	//remove <idle>
 	preemptionSorted = _.select(preemptionSorted, function(element){return (element.name != "<idle>") && (element.preemptionCount != 0);});

  var preemptionList = document.getElementById("preemption-list");

  for (var r = displayNum - 1; r >= 0; r--) {
    var task = preemptionSorted[r];
    makeRow(task, preemptionList, "preemptionCount");
  }
}

function getTopRuntime()
{
  //sort processes by preemptionCount
  runTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalRuntime);});
  //remove <idle>
  runTimeSorted = _.select(runTimeSorted, function(element){return (element.name != "<idle>") && (element.totalRuntime != 0);});
  
  var displayNum = 10;
  var runtimeList = document.getElementById("runtime-list");

  for (var r = displayNum - 1; r >= 0; r--) {
    var task = runTimeSorted[r];
    makeRow(task, runtimeList, "totalRuntime");
  }
}

function getTopWaittime()
{
  //sort processes by preemptionCount
  waitTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalWaittime);});
  //remove <idle>
  waitTimeSorted = _.select(waitTimeSorted, function(element){return (element.name != "<idle>") && (element.totalWaittime != 0);});
  
  var displayNum = 10;
  var waittimeList = document.getElementById("waittime-list");

  for (var r = displayNum - 1; r >= 0; r--) {
    var task = waitTimeSorted[r];
    makeRow(task, waittimeList, "totalWaittime");
  }
}

function normalizeStartTime(numCPU)
{
  switchEvents = [];
  tempSwitchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
  tempSwitchEvents = _.groupBy(tempSwitchEvents, function(e){return e.cpu;});
  for (var cpu = 0; cpu < numCPU; cpu++)
  {
    var firstStartTime = tempSwitchEvents[cpu][0].startTime;
    tempSwitchEvents[cpu] = _.map(tempSwitchEvents[cpu], function(e) {e.startTime -= firstStartTime; return e});
    switchEvents = switchEvents.concat(tempSwitchEvents[cpu]);
  }

  return switchEvents;
}

function getLongestCPUDuration(numCPU)
{
  //switch these and find last event per cpu FIXME
  switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
  switchEvents = _.groupBy(switchEvents, function(e){return e.cpu;});

  //console.log(switchEvents);

  setTimeout(function(e){return true}, 10000);

  maxDuration = 0;
  for (var j = 0; j < numCPUs; j++)
  {
    var lastIndex = switchEvents[j].length-1;
    var sum = _.reduce(switchEvents[j], function(sum, next) { return sum += next.duration }, 0);
    console.log(sum);
    if (sum > maxDuration) {
      maxDuration = sum
    }
  }

  return maxDuration;
}

document.addEventListener("load", openDB());
