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

                  numCPUsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

                  numCPUsRequest.onsuccess = function(e) {
                    numCPUs = e.target.result;

                    switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
                    // this is the time of the last event for the end of the chart
                    
                    maxDuration = getLongestCPUDuration(switchEvents);

                    window.localStorage.setItem("maxDuration", maxDuration);
                    
                    var gantt = d3.gantt(chartType).taskTypes(_.range(numCPUs)).timeDomain(maxDuration);
                    switchEvents = normalizeStartTime(switchEvents);
                    
                    switchEvents = calculateDurationBetweenSwitches(switchEvents, numCPUs);

                    gantt(switchEvents); //feeding it the relevant events
                    setColoringOfTasks();
                    $('.loader').fadeOut("slow");
                  }
        }
    }
  }
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
      // var style = document.createElement('style');
      // style.type = 'text/css';
      // style.innerHTML = '.idle { fill: white; }';
      // document.getElementsByTagName('head')[0].appendChild(style);
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

