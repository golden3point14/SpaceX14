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

$('#mainButton').css('background-color', '#315B7E');

function openDB()
{
  var openRequest = indexedDB.open("events", 7);

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
    if (JSONtasks[i].name !== '<idle>') {
      if (JSONevents[JSONtasks[i].events[0]].eventType == "print") {
        var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '.' + JSONtasks[i].name + JSONtasks[i].pid + ' { fill: red; }';
      document.getElementsByTagName('head')[0].appendChild(style);
      } else {
      var style = document.createElement('style');
      style.type = 'text/css';
      var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
      // console.log(JSONtasks[i].name + " color: " + color);
      style.innerHTML = '.' + JSONtasks[i].name + JSONtasks[i].pid + ' { fill: #' + color + '; }';
      
      // var div = document.createElement("div");
      // div.style.width = "1000px";
      // // div.style.height = "100px";
      // div.style.background = "#" + color;
      // div.style.color = "white";
      // div.style.textAlign = "right";
      // div.innerHTML = JSONtasks[i].name;

      // document.body.appendChild(div);
      // style.innerHTML += '.' + JSONtasks[i].name + JSONtasks[i].pid + ':hover { fill: red; }';

      document.getElementsByTagName('head')[0].appendChild(style);
    }
      } else {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.idle { fill: white; }';
        // style.innerHTML += '.idle:hover { fill: red; }';

        document.getElementsByTagName('head')[0].appendChild(style);
      }
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

    row.ondblclick = function(myrow){
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

  var preemptionList = document.getElementById("preemption-list");

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
  var runtimeList = document.getElementById("runtime-list");

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
  var waittimeList = document.getElementById("waittime-list");
 
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

function normalizeStartTime(numCPU)
{
  switchEvents = [];
  tempSwitchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
  cycleMarkers = _.filter(JSONevents, function(e){return e.eventType === "print";});
  tempSwitchEvents = _.groupBy(tempSwitchEvents, function(e){return e.cpu;});

  for (var cpu = 0; cpu < numCPU; cpu++)
  {
    tempSwitchEvents[cpu].sort(function(a,b) {return a.startTime - b.startTime;});

    var firstStartTime = tempSwitchEvents[cpu][0].startTime;
    for (var i = 0; i < tempSwitchEvents[cpu].length; i++) {
      var switchEvent = tempSwitchEvents[cpu][i];
      switchEvent.normalStartTime = switchEvent.startTime - firstStartTime;
      
      if (i != tempSwitchEvents[cpu].length - 1) {
        var nextEvent = tempSwitchEvents[cpu][i+1];
        switchEvent.processLength = nextEvent.startTime - switchEvent.startTime;
      } else {
        switchEvent.processLength = 0;
      }

    }
    // console.log(tempSwitchEvents[cpu]);
    // tempSwitchEvents[cpu] = _.map(tempSwitchEvents[cpu], function(e) {
    //   e.normalStartTime = e.startTime - firstStartTime;

    //   return e;
    //  });
    switchEvents = switchEvents.concat(tempSwitchEvents[cpu]);
  }

  switchEvents = switchEvents.concat(cycleMarkers);
  return switchEvents;
}

function getLongestCPUDuration(numCPU)
{
  //switch these and find last event per cpu FIXME
  switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
  switchEvents = _.groupBy(switchEvents, function(e){return e.cpu;});

  // console.log(switchEvents);
  // console.log("numCPUs: " + numCPUs);

  setTimeout(function(e){return true}, 10000);

  maxDuration = 0;
  for (var j = 0; j < numCPUs; j++)
  {
    // console.log("j = " + j);
    var lastIndex = switchEvents[j].length-1;
    var sum = _.reduce(switchEvents[j], function(sum, next) { return sum += next.duration }, 0);
    // console.log(sum);
    if (sum > maxDuration) {
      maxDuration = sum
    }
  }

  return maxDuration;
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
