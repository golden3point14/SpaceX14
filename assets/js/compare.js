var files;
var events;
var tasks;
var reader = new FileReader();
var autocompleteNames;
var currentTasks;
var gantt;
var isSearch = false;
comparingTasks = [];

var maxDuration = window.localStorage.getItem("maxDuration");
var firstEventTime = window.localStorage.getItem("firstEventTime"); //for normalizing values

$('#compareButton').css('background-color', '#315B7E');

//pulls the data from the IndexedDB and displays it
function openDB() {
  var openRequest = indexedDB.open("events", 8);

  openRequest.onerror = function(e) {
    console.log("Error in OpenRequest");
    console.dir(e);
  }

  openRequest.onsuccess = function(e) {
    console.log("openRequest success!");
    db = e.target.result;

    //get data
    var eventsRequest = db.transaction(["Events"], "readonly")
                         .objectStore("Events").get(1);
    var tasksRequest = db.transaction(["Tasks"], "readonly")
                         .objectStore("Tasks").get(1);

    eventsRequest.onerror = function(e) {
      console.log("error", e.target.error);
    }

    eventsRequest.onsuccess = function(e) {
      events = e.target.result;
      var temp = JSON.parse(window.localStorage.getItem("compareData"));

      for (var i = 0; i < temp.length; i++) {
        comparingTasks.push(temp[i])
      }
      
      if (comparingTasks) {
        for (var i = 0; i < comparingTasks.length; i++) {
          makeGantt(comparingTasks[i]);
          makeRemoveButton(comparingTasks[i]);
        }
      }
      $('.loader').fadeOut("slow");
    }

    tasksRequest.onerror = function(e) {
      console.log("error", e.target.error);
    }

    tasksRequest.onsuccess = function(e) {
      tasks = e.target.result;
      makeAutocompleteList();
      autoCompleteNames();
    }
  }
}

function makeAutocompleteList()
{
  autocompleteNames = [];
  for (var i = 0; i < tasks.length; i++) {
    autocompleteNames.push(tasks[i].name + ", PID: " + tasks[i].pid);
  }
}

// Add a .state attribute to switch events, indicating
// if the process was running, waiting, or blocked for the
// duration of that event.
//    R - running
//    B - blocked
//    W - waiting
function labelEventState(switchEvent, currentPID) {
  // We are switching to this task, so state is running
  if (switchEvent.activePID === currentPID) {
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

function getRelevantSwitches(filterString) {
  var currentTaskName = makeCurrentTaskName(filterString);
  var currentPID = makeCurrentPID(filterString);

  // Get switch events where current task was being swapped in or out,
  // e.g. where event.name or event.activeName are current task
  currentTaskSwitches = _.filter(events, function(e) {
    return e.eventType === "sched_switch" &&
          (e.pid == currentPID || e.activePID == currentPID)});



  // Map state to each switch: running, waiting, or blocked
  labeledTaskSwitches = _.map(currentTaskSwitches, function(e) { return labelEventState(e, currentPID);});

  // Calculate how long task was in each state
  labeledTaskSwitches = calculateDurations(labeledTaskSwitches);

  // Normalize
  labeledTaskSwitches = normalize(labeledTaskSwitches);

  return labeledTaskSwitches;
}

// Normalize
function normalize(labeledTaskSwitches) {
  var earliestTime = labeledTaskSwitches[0].startTime;
  return _.map(labeledTaskSwitches, function(task) { task.normalStartTime = task.startTime - firstEventTime; return task; });
}

function makeCurrentTaskName(filterString) {
  var indexOfPID = filterString.indexOf(", PID:");
  var currentTaskName = filterString.slice(0,indexOfPID);
  return currentTaskName;
}

function makeCurrentPID(filterString) {
  var indexOfPID = filterString.indexOf("PID:");
  var currentPID = filterString.slice(indexOfPID + 5);
  return currentPID;
}

function makeGantt(filterString) {
  var currentTaskName = makeCurrentTaskName(filterString);
  var currentPID = makeCurrentPID(filterString);
  var currentTaskSwitches = getRelevantSwitches(filterString);

  //originally the graphs endpoint (ie timeDomain(totalTime))
  margin = {
    top: 0,
    bottom: 10,
    left: 105,
    right: 0
  }

  var safeTaskName = makeSafeForCSS(filterString);

  var $container = $('#ganttChart').packery({
    columnWidth: 2000,
    rowHeight: 115
  })

  $container.packery( 'on', 'dragItemPositioned', orderItems );

  var div = document.createElement("div");
  var handle = document.createElement("div");
  div.id = safeTaskName + "Div";
  div.className = "item";
  div.title = filterString;
  handle.className = "handle";
  div.appendChild(handle);
  document.getElementById("ganttChart").appendChild(div);

  var draggie = new Draggabilly(div, {
    handle: '.handle',
    axis: 'y'
  });

  $container.append(div).packery( 'appended', div);
  $container.packery('bindDraggabillyEvents', draggie);
  $container.fadeIn();
    
  gantt = d3.gantt("COMPARE").taskTypes(["sched_switch"]).timeDomain(maxDuration).yAttribute("eventType").yLabel(filterString).id(safeTaskName).height(100).margin(margin);
  gantt(currentTaskSwitches, "#" + safeTaskName + "Div");
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
  $('#search-process').typeahead('val', '');// Clear text from typeahead

  var filterString = chosenTask["value"];
  var display = true;
  console.log(filterString);
  // check if we are already displaying this task
  for (var i = 0; i < comparingTasks.length; i++) {
    console.log(comparingTasks[i]);
    if (comparingTasks[i] == filterString) {
      display = false;
      break;
    }
  }

  // otherwise add the task
  if (display) {
    comparingTasks.push(filterString);
    window.localStorage.setItem("compareData", JSON.stringify(comparingTasks));

    $('#addedNotify').fadeIn(200);
    $('#addedNotify').fadeOut(1000);

    makeGantt(filterString);
    makeRemoveButton(filterString);
  }
}

// Makes remove button for every task
function makeRemoveButton(taskName) {
  var safeTaskName = makeSafeForCSS(taskName);

  var btn = document.createElement("button");
  var t = document.createTextNode("Remove Task");
  var idString = safeTaskName + "Button";
  btn.id = idString;
  btn.className = "removeButton btn";
  btn.appendChild(t);
  document.getElementById(safeTaskName + "Div").appendChild(btn);

  document.getElementById(idString).onclick = function() {
    d3.select("#"+safeTaskName).remove();
    window.localStorage.getItem(taskName);
    window.localStorage.removeItem(taskName);
    var index = comparingTasks.indexOf(taskName);

    if(index >-1) {
      comparingTasks.splice(index,1);
    }

    // Updates local storage and removes the graph
    window.localStorage.setItem("compareData", JSON.stringify(comparingTasks));
    var child = document.getElementById(idString);
    child.parentNode.removeChild(child);

    $('#ganttChart').packery('remove', div);
    $('#ganttChart').packery();

    var div = document.getElementById(safeTaskName + "Div");
    div.parentNode.removeChild(div);
  }
}

// Removes characters that are illegal for css class names from a string
function makeSafeForCSS(str) {
  return str.replace(/\/|:|\.|\ |,/g, "");
}

function orderItems() {
  var itemElems = $('#ganttChart').packery('getItemElements');

  // reset / empty oder array
  var sortOrder = [];
  sortOrder.length = 0;
  for (var i=0; i< itemElems.length; i++) {
    sortOrder[i] = itemElems[i].getAttribute("title");
  }

  // save ordering
  localStorage.setItem('compareData', JSON.stringify(sortOrder) );
}

document.addEventListener("load", openDB());

