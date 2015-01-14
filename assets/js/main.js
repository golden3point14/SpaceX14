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

var chartType = "MAIN"; //for gantt

$('#mainButton').css('background-color', '#315B7E');

function openDB()
{
  var openRequest = indexedDB.open("events", 8);

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

                                    switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
                                    // this is the time of the last event for the end of the chart
                                    
                                    maxDuration = getLongestCPUDuration(switchEvents);
                                    

                                    var gantt = d3.gantt(chartType).taskTypes(_.range(numCPUs)).timeDomain(maxDuration);
                                    switchEvents = normalizeStartTime(switchEvents);
                                    
                                    switchEvents = calculateDurationBetweenSwitches(switchEvents, numCPUs);

                                    
                                    gantt(switchEvents); //feeding it the relevant events
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
    
    if (JSONtasks[i].name !== '<idle>') {

      // trying to mark cycles
      if (JSONevents[JSONtasks[i].events[0]].eventType == "print") {

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.' + JSONtasks[i].name + JSONtasks[i].pid + ' { fill: red; }';
        document.getElementsByTagName('head')[0].appendChild(style);
      } 

      // generating colors for non-cycle, non idle events
      else {
        var style = document.createElement('style');
        style.type = 'text/css';
        var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
        style.innerHTML = '.' + JSONtasks[i].name + JSONtasks[i].pid + ' { fill: #' + color + '; }';
      
        document.getElementsByTagName('head')[0].appendChild(style);
      }
    } 
    
    // make <idle> white
    else {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '.idle { fill: white; }';
      document.getElementsByTagName('head')[0].appendChild(style);
    }
  }
}

function makeRow(task, table, attribute) {
    var row = table.insertRow(0);

    var nameCell = row.insertCell(0);
    nameCell.innerHTML = task.name;

    var pidCell = row.insertCell(1);
    pidCell.innerHTML = task.pid;

    var countCell = row.insertCell(2);
    countCell.innerHTML = task[attribute];

    row.onclick = function(myrow){
                      return function() { 
                         var cell = myrow.getElementsByTagName("td")[0];
                         var id = cell.innerHTML;
                         // console.log("id:" + id);
                         clickCell(id);
                      };
                  }(row);
}

function getTopPreemptions()
{

  var displayNum = 10;

	//sort processes by preemptionCount
 	preemptionSorted = _.sortBy(JSONtasks, function(element){return -1*(element.preemptionCount);});
 	//remove <idle>
 	preemptionSorted = _.select(preemptionSorted, function(element){return (element.name != "<idle>") && (element.preemptionCount != 0);});

  var preemptionList = document.getElementById("preemption-list").tBodies[0];

  if (preemptionSorted.length == 0) {
    preemptionList.style.display = "none";
  }

  for (var r = displayNum - 1; r >= 0; r--) {
    var task = preemptionSorted[r];
    if (task) {
      //console.log(task);
      makeRow(task, preemptionList, "preemptionCount");
    }
  }

  // addRowHandlers();

}

function getTopRuntime()
{
  //sort processes by preemptionCount
  runTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalRuntime);});
  //remove <idle>
  runTimeSorted = _.select(runTimeSorted, function(element){return (element.name != "<idle>") && (element.totalRuntime != 0);});
  
  var displayNum = 10;
  var runtimeList = document.getElementById("runtime-list").tBodies[0];

  if (runTimeSorted.length == 0) {
    runtimeList.style.display = "none";
  }

  for (var r = displayNum - 1; r >= 0; r--) {
      var task = runTimeSorted[r];
    if (task) {
      makeRow(task, runtimeList, "totalRuntime");
    }
  }
}

function getTopWaittime()
{
  //sort processes by preemptionCount
  waitTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalWaittime);});
  //remove <idle>
  waitTimeSorted = _.select(waitTimeSorted, function(element){return (element.name != "<idle>") && (element.totalWaittime != 0);});
  
  var displayNum = 10;
  var waittimeList = document.getElementById("waittime-list").tBodies[0];
 
  if (waitTimeSorted.length == 0) {
    waittimeList.style.display = "none";
  }

  for (var r = displayNum - 1; r >= 0; r--) {
    var task = waitTimeSorted[r];
    if (task) {
      makeRow(task, waittimeList, "totalWaittime");
    }
  }
}

function normalizeStartTime(switchEvents)
{
  var earliestTime = switchEvents[0].startTime;
  switchEvents = _.map(switchEvents, function(e) {e.normalStartTime = e.startTime - earliestTime; return e;});
  return switchEvents;
}

function calculateDurationBetweenSwitches(switchEvents, numCPUs) {
  var groupedByCPU = _.groupBy(switchEvents, function(e){return e.cpu;});

  var newSwitchEvents = [];

  for (var cpu = 0; cpu < numCPUs; cpu++) {
    var tempEvents = groupedByCPU[cpu];

    for (var i = 0; i < tempEvents.length - 1; i++) {
      var currEvent = tempEvents[i];
      currEvent.processTime = tempEvents[i + 1].startTime - currEvent.startTime;
    }

    // Set the duration of the last event to be 0, as we don't know the start time
    // of what happened after it
    tempEvents[tempEvents.length - 1].processTime = 0;

    newSwitchEvents = newSwitchEvents.concat(groupedByCPU[cpu]);
  }
  
  return newSwitchEvents;
}

function calculateDuration(eventList) {
  return _.reduce(eventList, function(sum, next) { return sum += next.duration }, 0)
};

function getLongestCPUDuration(switchEvents)
{
  switchEventsByCPU = _.groupBy(switchEvents, function(e){return e.cpu;});

  return _.max(_.map(switchEventsByCPU, calculateDuration));
}

document.addEventListener("load", openDB());

// $('#preemption-list tr').click(function(e){
//     console.log($(e.target).text());
//     clickCell($(e.target).text()); // using jQuery
// })

function clickCell(cellData)
{
  window.localStorage.setItem("cellData", cellData);
  window.location.href = "process.html";
}
