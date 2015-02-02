var JSONevents;
var JSONtasks;
var numCPUs;

var chartType = "MAIN"; //for gantt

$('#mainButton').css('background-color', '#315B7E');

function openDB()
{
  var openRequest = indexedDB.open("events", 8);

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    var db = e.target.result;

    var eventsRequest = db.transaction(["Events"],"readwrite")
              .objectStore("Events").get(1);

    var tasksRequest = db.transaction(["Tasks"], "readwrite")
              .objectStore("Tasks").get(1);

    var numCPUsRequest = db.transaction(["numCPUs"], "readwrite")
              .objectStore("numCPUs").get(1);

    // some kind of error handling
    eventsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

    eventsRequest.onsuccess = function(e) {
          JSONevents = e.target.result;
           // some kind of error handling
          tasksRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

          tasksRequest.onsuccess = function(e) {
                  JSONtasks = e.target.result;
                  getTopPreemptions();
                  getTopRuntime();
                  getTopWaittime();

                  numCPUsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

                  numCPUsRequest.onsuccess = function(e) {
                    numCPUs = e.target.result;

                    switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
                    // this is the time of the last event for the end of the chart
                    
                    maxDuration = getLongestCPUDuration(switchEvents);
                    
                    // var gantt = d3.gantt(chartType).taskTypes(_.range(numCPUs)).timeDomain(maxDuration);
                    switchEvents = normalizeStartTime(switchEvents);
                    
                    switchEvents = calculateDurationBetweenSwitches(switchEvents, numCPUs);

                    // gantt(switchEvents); //feeding it the relevant events
                    setColoringOfTasks();
                    makeTimeLine(switchEvents);
                    $('.loader').fadeOut("slow");
                  }
        }
    }
  }
}

function makeTimeLine(switchEvents) {
  var count = 200642;

  // create groups
  // var groups = new vis.DataSet([
  //   {id: 1, content: 'Truck&nbsp;1'},
  //   {id: 2, content: 'Truck&nbsp;2'},
  //   {id: 3, content: 'Truck&nbsp;3'},
  //   {id: 4, content: 'Truck&nbsp;4'}
  // ]);

  var cpus = new vis.DataSet()
  for (var i = 0; i < numCPUs; i++) {
    cpus.add({
      id: i,
      content: 'CPU '+i
    })
  }

  // create items
  var items = new vis.DataSet();
  var groupedByCPU = _.groupBy(switchEvents, function(e){return e.cpu;});

  var order = 1;
  var cpu = 0;
  for (var j = 0; j < numCPUs; j++) {
    var date = new Date();
    for (var i = 0; i < groupedByCPU[j].length; i++) {
      // date.setHours(date.getHours() +  4 * (Math.random() < 0.2));
      var start = new Date(date);
      var currEvent = groupedByCPU[j][i];

      date.setHours(date.getHours() + 2 + Math.floor(Math.random()*4));
      var end = new Date(date);

      items.add({
        id: order,
        group: currEvent.cpu,
        start: start,
        end: end,
        className: "task" + currEvent.pid
      });

      order++;
    }
    cpu++;
  }

  // console.log(switchEvents);

  // var groupedByCPU = _.groupBy(switchEvents, function(e){return e.cpu;});
  // // var prevEvent;
  // var currEvent;
  // for (var cpu = 0; cpu < numCPUs; cpu++) {
  //   for (var i = 0; i < groupedByCPU[cpu].length; i++) {
  //     // console.log("adding item " + i + "for cpu " + cpu);
  //     currEvent = groupedByCPU[cpu][i];
  //     // prevEvent = switchEvents[i-1];
  //     // console.log(currEvent);

  //     items.add({
  //       group: currEvent.cpu,
  //       start: currEvent.normalStartTime,
  //       end: currEvent.normalStartTime + currEvent.processTime
  //     })
  //   }
  // }


  // specify options
  var options = {
    stack: false,
    start: new Date(),
    end: new Date(1000*60*60*24 + (new Date()).valueOf()),
    editable: false,
    margin: {
      item: 10, // minimal margin between items
      axis: 5   // minimal margin between items and the axis
    },
    orientation: 'top'
  };


  // create a Timeline
  var container = document.getElementById('ganttChart');
  timeline = new vis.Timeline(container, null, options);

  timeline.setGroups(cpus);

  timeline.setItems(items);

  console.log("done making timeline");
}

function setColoringOfTasks() {
  // For each task, create a CSS class with a random color
  Math.seedrandom('hello.');

  for (var i = 0; i < JSONtasks.length; i++) {
    
    if (JSONtasks[i].name !== '<idle>') {

      // trying to mark cycles
      if (JSONevents[JSONtasks[i].events[0]].eventType == "print") {

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.task' + JSONtasks[i].pid + ' { fill: red; }';
        document.getElementsByTagName('head')[0].appendChild(style);
      } 

      // generating colors for non-cycle, non idle events
      else {
        var style = document.createElement('style');
        style.type = 'text/css';
        var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
        style.innerHTML = '.task' + JSONtasks[i].pid + ' { background-color: #' + color + '; border-color: #' + color + '; }';
      
        document.getElementsByTagName('head')[0].appendChild(style);
      }
    } 

    // make <idle> white
    else {
      // var style = document.createElement('style');
      // style.type = 'text/css';
      // style.innerHTML = '.idle { fill: white; }';
      // document.getElementsByTagName('head')[0].appendChild(style);
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
 	var preemptionSorted = _.sortBy(JSONtasks, function(element){return -1*(element.preemptionCount);});
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
  var runTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalRuntime);});
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
  var waitTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalWaittime);});
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
}

function getLongestCPUDuration(switchEvents)
{
  switchEventsByCPU = _.groupBy(switchEvents, function(e){return e.cpu;});

  return _.max(_.map(switchEventsByCPU, calculateDuration));
}

document.addEventListener("load", openDB());

function clickCell(cellData)
{
  window.localStorage.setItem("cellData", cellData);
  window.location.href = "process.html";
}
