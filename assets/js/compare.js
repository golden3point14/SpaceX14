//document.getElementById("ganttChart").innerHTML=window.localStorage.getItem("ganttChart");

var files;
var events;
var tasks;
var reader = new FileReader();
// var autocompleteEventTypes;
var autocompleteNames;
var currentTasks;
var gantt;

$('#compareButton').css('background-color', '#315B7E');

//pulls the data from the IndexedDB and displays it
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
    db = e.target.result;

    //get data
    var eventsRequest = db.transaction(["Events"], "readonly")
                         .objectStore("Events").get(1);
    var tasksRequest = db.transaction(["Tasks"], "readonly")
                         .objectStore("Tasks").get(1);
    var namesRequest = db.transaction(["AutocompleteNames"], "readonly")
                         .objectStore("AutocompleteNames").get(1);

    eventsRequest.onerror = function(e){console.log("error", e.target.error);}

    eventsRequest.onsuccess = function(e) {
            events = e.target.result;
            var currentTaskName = window.localStorage.getItem("cellData");
            
            if (currentTaskName) {
              makeGantt(currentTaskName);
            }
            $('.loader').fadeOut("slow");
          }

    tasksRequest.onerror = function(e){console.log("error", e.target.error);}
    
    tasksRequest.onsuccess = function(e) {
                                tasks = e.target.result;
                              }

    namesRequest.onerror = function(e){console.log("error", e.target.error);}

    namesRequest.onsuccess = function(e) {
                                autocompleteNames = e.target.result;
                                autoCompleteNames();
                                autoSearch();
                              }
  }
}

// Add a .state attribute to switch events, indicating
// if the process was running, waiting, or blocked for the
// duration of that event.
//    R - running
//    B - blocked
//    W - waiting
function labelEventState(switchEvent, currentTaskName) {
  // We are switching to this task, so state is running
  if (switchEvent.activeName === currentTaskName) {
    switchEvent.state = "R";
  } else {
    // If event is a preemption, task is being put back into
    // run queue to wait for the scheduler
    if (switchEvent.preempted) {
      switchEvent.state = "B";
    } else {
      // sleepy task
      switchEvent.state = "W";
    }
  }
  return switchEvent;
}

// Add .processTime attribute that indicates time between
// the beginning of the current switch event and the next
function calculateDurations(labeledTaskSwitches) {
  var lastIndex = labeledTaskSwitches.length - 1;
  // Get proper duration times between switches
  for (var i = 0; i < lastIndex; i++) {
    labeledTaskSwitches[i].processTime = 
      labeledTaskSwitches[i + 1].startTime - labeledTaskSwitches[i].startTime;
  }
  // Last event special
  labeledTaskSwitches[lastIndex].processTime = 0;

  return labeledTaskSwitches;
}

function getRelevantSwitches(currentTaskName) {
  // Get switch events where current task was being swapped in or out,
  // e.g. where event.name or event.activeName are current task
  currentTaskSwitches = _.filter(events, function(e) {
    return e.eventType === "sched_switch" &&
          (e.name === currentTaskName || e.activeName === currentTaskName)});

  // Map state to each switch: running, waiting, or blocked
  labeledTaskSwitches = _.map(currentTaskSwitches, function(e) { return labelEventState(e, currentTaskName);});

  // Calculate how long task was in each state
  labeledTaskSwitches = calculateDurations(labeledTaskSwitches);


  // Normalize
  labeledTaskSwitches = normalize(labeledTaskSwitches);

  return labeledTaskSwitches;
}

// Normalize
function normalize(labeledTaskSwitches) {
  var earliestTime = labeledTaskSwitches[0].startTime;
  return _.map(labeledTaskSwitches, function(task) { task.normalStartTime = task.startTime - earliestTime; return task; });
}

function makeGantt(currentTaskName) {
  var currentTaskSwitches = getRelevantSwitches(currentTaskName);

  totalTime = _.reduce(labeledTaskSwitches, function(sum, next) { return sum += next.processTime }, 0);

  gantt = d3.gantt("PROCESS").taskTypes(["sched_switch"]).timeDomain(totalTime).yAttribute("eventType").yLabel("");
  gantt(currentTaskSwitches);
}

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    // an array that will be populated with substring matches
    var matches = [];
 
    _.map(strs, function(str) {
      // Check if user query q is substring of str
      if (str.indexOf(q) != -1) {
        // Typeahead expects javascript object
        matches.push({ value: str });
      }
    });
 
    cb(matches);
  };
};

function autoCompleteNames() {
  // Setup typeahead to search task names
  $('#search-process').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'autocompleteNames',
      displayKey: 'value',
      source: substringMatcher(autocompleteNames)
  })
  .on('typeahead:autocompleted', function($e, chosenTask) {
    addAnotherTask(chosenTask);
  })
  .on('typeahead:selected', function($e, chosenTask) {
    addAnotherTask(chosenTask);
  });
}

function addAnotherTask(chosenTask) {
  $('#search-process').typeahead('close');

  var filterString = chosenTask["value"];
  window.localStorage.setItem("cellData", filterString);

  searchTasks(filterString); // Update table of preemptions
  //d3.selectAll("svg").remove(); // Remove old chart
  document.getElementById('ganttChart').innerHTML += filterString;
  makeGantt(filterString);
}
/*
function changeToNewTask(chosenTask) {
  $('#search-process').typeahead('close');

  var filterString = chosenTask["value"];
  window.localStorage.setItem("cellData", filterString);

  searchTasks(filterString); // Update table of preemptions
  d3.selectAll("svg").remove(); // Remove old chart
  makeGantt(filterString);
}
*/
function searchTasks(filterString)
{
  if (filterString != "") {
  currentTasks = _.filter(tasks, function(e){return e.name === filterString;});
  var data = [];
  var newData = [];

  for (var i = 0; i < currentTasks.length; i++) {
    // console.log(currentTasks[i]);
    if (currentTasks[i].preemptedBy) {
    for (var j = 0; j < currentTasks[i].preemptedBy.length; j++){
      // data.push([currentTasks[i].preemptedBy[j]]);
      if (!_.contains(data, currentTasks[i].preemptedBy[j])) {
        newData.push([currentTasks[i].preemptedBy[j], 1]);
        data.push(currentTasks[i].preemptedBy[j]);
      } else {
        var process = _.find(newData, function(a) {return a[0] == currentTasks[i].preemptedBy[j];});
        data.push(currentTasks[i].preemptedBy[j]);
        process[1]++;
      }
    }
    }
  }

  /*document.getElementById('table_title').innerHTML = filterString + 
    " was preempted " + data.length + " times by:";*/


  if ( $.fn.dataTable.isDataTable( '#example' ) ) {
      // table = $('#example').DataTable();
      var table = $('#example').DataTable();
      table.destroy();
      table = $('#example').dataTable( {
      data: newData,
      columns: [
          { "title": "Process Name" },
          { "title": "Number of Preemptions" }
      ],
      deferRender:    true,
      dom:            "frtiS",
      scrollY:        400,
      scrollCollapse: true,
      order:          [[1, 'desc']]
    } ); 

      // table.on( 'click', 'td', function () {
      //     alert( 'Clicked on cell in visible column: '+table.cell( this ).index().columnVisible );
      // } );
  }
  else {
      var table = $('#example').dataTable( {
      data: newData,
      columns: [
          { "title": "Process Name" },
          { "title": "Number of Preemptions" }
      ],
      deferRender:    true,
      dom:            "frtiS",
      scrollY:        400,
      scrollCollapse: true,
      order:          [[1, 'desc']]
    } ); 

      // table.on( 'click', 'td', function () {
      //     alert( 'Clicked on cell in visible column: '+table.cell( this ).index().columnVisible );
      // } );
  } 
  }               
}

function autoSearch() {
  searchTasks(window.localStorage.getItem("cellData"));
}
/*
$(document).ready(function() {
	console.log("starting to load table");
	$('#ganttChart').load('process.html #ganttChart');
	console.log("should have loaded table");
});*/

document.addEventListener("load", openDB());
