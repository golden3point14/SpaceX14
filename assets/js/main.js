/**
 * @author Wendy Brooks
 * @author May Lynn Forssen
 * @author Alix Joe
 * @author Rachel Macfarlane
 * Created 2015
 */

var JSONevents;
var JSONtasks;
var numCPUs;
var autocompleteNames;
var autocompleteEventTypes;
var currentResults;

var chartType = "MAIN"; //for gantt

var firstEventTime;

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
    var db = e.target.result;

    var eventsRequest = db.transaction(["Events"],"readonly")
              .objectStore("Events").get(1);

    var tasksRequest = db.transaction(["Tasks"], "readonly")
              .objectStore("Tasks").get(1);

    var numCPUsRequest = db.transaction(["numCPUs"], "readonly")
              .objectStore("numCPUs").get(1);

    var eventTypesRequest = db.transaction(["AutocompleteEventTypes"], "readonly")
                              .objectStore("AutocompleteEventTypes").get(1);

    var namesRequest = db.transaction(["AutocompleteNames"], "readonly")
                          .objectStore("AutocompleteNames").get(1);

    // some kind of error handling
    eventsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

    eventsRequest.onsuccess = function(e) {
          JSONevents = e.target.result;
          currentResults = e.target.result;
           // some kind of error handling
          tasksRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

          tasksRequest.onsuccess = function(e) {
                  JSONtasks = e.target.result;

                  numCPUsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

                  numCPUsRequest.onsuccess = function(e) {
                    numCPUs = e.target.result;

                    // filter so that we only have switch events
                    switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
                    
                    // takes the start time of the events and normalizes them to zero.
                    switchEvents = normalizeStartTime(switchEvents);
                    
                    // this is the time of the last event, used as the end of the chart
                    var maxDuration = getLongestCPUDuration(switchEvents);

                    // save this value for later use on other pages.
                    window.localStorage.setItem("maxDuration", maxDuration);
                    
                    // set up the gantt chart
                    var gantt = d3.gantt(chartType).taskTypes(_.range(numCPUs)).timeDomain(maxDuration);
                    
                    // calculate how long each event lasts
                    switchEvents = calculateDurationBetweenSwitches(switchEvents, numCPUs);

                    // save the first event time for later use
                    window.localStorage.setItem("firstEventTime", firstEventTime);

                    // pass the gantt chart the events
                    gantt(switchEvents, "#ganttChart");

                    // set the colors
                    setColoringOfTasks();

                    // load the tables
                    displayTable();

                    // fadeout the loader
                    $('.loader').fadeOut("slow");
                  }
        }
    }

    eventTypesRequest.onerror = function(e) {console.log("error", e.target.error);}

    eventTypesRequest.onsuccess = function(e) {
                                autocompleteEventTypes = e.target.result;
                                // autoCompleteEventTypes();
                                clickSearch();
                              }

    namesRequest.onerror = function(e) {console.log("error", e.target.error);}

    namesRequest.onsuccess = function(e) {
                                autocompleteNames = e.target.result;
                                autoCompleteEventTypes();
                                clickSearch();
                              }
  }
}

function autoCompleteEventTypes() {
$('input').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'autocompleteEventTypes',
  displayKey: 'value',
  source: substringMatcher(autocompleteEventTypes.concat(autocompleteNames))
});
}

function clickSearch() {
  $('.tt-dropdown-menu').click(function() {
             var filterString = $('.tt-input').val();
             $('#table_id').dataTable().fnFilter(filterString);
      });
}


function setColoringOfTasks() {
  // For each task, create a CSS class with a random color
  Math.seedrandom('hello.');

  for (var i = 0; i < JSONtasks.length; i++) {
    
    if (JSONtasks[i].name !== '<idle>') {
      // generating colors for non-cycle, non idle events
      var style = document.createElement('style');
      style.type = 'text/css';
      var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
      style.innerHTML = '.' + JSONtasks[i].name + JSONtasks[i].pid + ' { fill: #' + color + '; }';
    
      document.getElementsByTagName('head')[0].appendChild(style);
    } 
  }
}

// normalizes all the start times with respect to 0 and the first event
// this allows us to have the graph start at zero.
function normalizeStartTime(switchEvents)
{
  var earliestTime = switchEvents[0].startTime;
  firstEventTime = earliestTime;
  switchEvents = _.map(switchEvents, function(e) {e.normalStartTime = e.startTime - earliestTime; return e;});
  return switchEvents;
}

// finds how long each event lasted. This is done per CPU,
// to avoid accidentally marking events across CPUs.
// Stores it in the processTime of an event.
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

// calculates the duration of all events, not just switch events.
function calculateDuration(eventList) {
  return _.reduce(eventList, function(sum, next) { return sum += next.duration }, 0)
}

// Determine which CPU ran the longest
// This gives us the end time for the graph.
function getLongestCPUDuration(switchEvents)
{
  switchEventsByCPU = _.groupBy(switchEvents, function(e){return e.cpu;});
  var longestTime = 0;

  // return _.max(_.map(switchEventsByCPU, calculateDuration));
  for (var cpu = 0; cpu < numCPUs; cpu++) {
    var tempEvents = switchEventsByCPU[cpu];
    var lastTime = tempEvents[tempEvents.length - 1].normalStartTime;
    if (longestTime < lastTime) {
      longestTime = lastTime;
    }
  }

  return longestTime;
}

// event handler
document.addEventListener("load", openDB());

// Click a row in the graph and get redirected to that
// particular task on the process page
function clickCell(processname, pid)
{
  var cellData = processname + ", PID: "+pid;
  window.localStorage.setItem("cellData", cellData);
  window.location.href = "process.html";
}

// Creates the events list table
function displayTable() {
	$(document).ready(function() {
    // Retrieve all the data about a particular task
  	var data = [];
  	for ( var i=0 ; i<currentResults.length ; i++ ) {
      // Changes the formatting of idle events from "<idle>"
      // in the raw data, to "idle" in the table
      if(currentResults[i].name=="<idle>") {
        currentResults[i].name='idle';
      } 
  	data.push( [ currentResults[i].cpu, currentResults[i].startTime, currentResults[i].name, currentResults[i].pid, currentResults[i].eventType, currentResults[i].extraInfo ] );
  	}

    // Creates the dataTable
  	var oTable = $('#table_id').dataTable( {
  		data:           data,
  		deferRender:    true,
  		dom:            "frtiS",
  		scrollY:        400,
  		scrollCollapse: true,
      stateSave: true,
  		order:          [[1, 'asc']],
      columns: [
        { "title" : "CPU", "width" : "40px" },
        { "title" : "Start time" },
        { "title" : "Name", "width" : "120px" },
        { "title" : "PID", "width" : "40px" },
        { "title" : "Event type", "width" : "140px" },
        { "title" : "Extra info" }
        ]
      } );

    // Click in the body of the table and get taken to that 
    // particular task on the process page
    $('#table_id tbody').on( 'dblclick', 'tr', function () {
      var cellData = oTable.fnGetData(this);
      clickCell(cellData[2], cellData[3]);
    } );
	} );
}

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    // an array that will be populated with substring matches
    var matches = [];
 
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      // Check if user query q is substring of str
      if (str.indexOf(q) != -1) {
        // Typeahead expects javascript object
        matches.push({ value: str });
      }
    });
    cb(matches);
  };
};
 
function scrollToTime(time) {
  var table = $('#table_id').DataTable();

  // If the table is not sorted by time, then sort it by time
  if(table) {
    if ((table.order()[0][0] != 1) || (table.order()[0[1] != 'asc'])) {
      table.order([[1,'asc']]);
      table.draw();
    }

    // Find the row index
    var rows = table.rows()[0];
    var index = findIndex(rows, time);

    // Scroll to that row
    var oSettings = $('#table_id').dataTable().fnSettings();
    oSettings.oScroller.fnScrollToRow(index, false);
  }
}

function findIndex(values, target) {
  return binarySearch(values, target, 0, values.length - 1);
};

function binarySearch(values, target, start, end) {
  var table = $('#table_id').DataTable();
  var startTime = table.cell(start, 1).data();
  var endTime = table.cell(end, 1).data()
  if (startTime > endTime) { return -1; } //does not exist

  var middle = Math.floor((start + end) / 2);
  var value = table.cell(values[middle], 1).data()

  if (value > target) { return binarySearch(values, target, start, middle-1); }
  if (value < target) { return binarySearch(values, target, middle+1, end); }
  return middle; //found!
}