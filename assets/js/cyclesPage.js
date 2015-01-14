var numCPUs;
var cycleEvents;
var events;
var currentCPU = 0;
var chartType = "CYCLES"
var taskNames;

$('#cyclesButton').css('background-color', '#315B7E');

function openDB()
{
	var openRequest = indexedDB.open("events", 8);

	openRequest.onsuccess = function(e)
	{
		console.log("openRequest success!");
		db = e.target.result;

		//get data
		var xactCPU = db.transaction(["numCPUs"], "readwrite");
		var storeCPU = xactCPU.objectStore("numCPUs");
		var resultCPU = storeCPU.get(1);
		var xactCycles = db.transaction(["cycleEvents"], "readwrite");
		var storeCycles = xactCycles.objectStore("cycleEvents");
		var resultCycles = storeCycles.get(1);

		//error handling
		resultCPU.onerror = function(e) {console.log("error", e.target.error.name);}

		//success
		resultCPU.onsuccess = function(e)
		{
			numCPUs = e.target.result;
			addOptions();
		}

		resultCycles.onerror = function(e){console.log("error", e.target.error.name);}

		resultCycles.onsuccess = function(e)
		{
			var xactEvents = db.transaction(["Events"], "readonly");
			var storeEvents = xactEvents.objectStore("Events");
			var resultEvents = storeEvents.get(1);

			cycleEvents = e.target.result;

			resultEvents.onerror = function(f){console.log("error", f.target.error.name);}
			resultEvents.onsuccess = function(f)
			{
				events = f.target.result;

				var numCycles = cycleEvents.length;

				var switchCycleEvents = _.filter(events, function(e){ return e.cpu === currentCPU && e.eventType === "sched_switch"; });

				addCycleAttribute();

				timeDomainEnd = getLongestCycleDuration(switchCycleEvents);

				var gantt = d3.gantt(chartType).taskTypes(_.range(numCycles))
					.timeDomain(timeDomainEnd).yAttribute("cycle");

				switchCycleEvents = normalizeStartTime(switchCycleEvents, numCycles);

				switchCycleEvents = calculateDurationBetweenSwitches(switchCycleEvents);

				gantt(switchCycleEvents);

				var xactTaskNames = db.transaction(["AutocompleteNames"], "readonly");
				var storeTaskNames = xactTaskNames.objectStore("AutocompleteNames");
				var resultTaskNames = storeTaskNames.get(1);

				resultTaskNames.onerror = function(h) {console.log("error", h.target.error.name);}

				resultTaskNames.onsuccess = function(h)
				{
					taskNames = h.target.result;

					setColoringOfTasks();
				}

			}

		}
	}
}

function setColoringOfTasks() {
	// For each task, create a CSS class with a random color
  for (var i = 0; i < taskNames.length; i++) {
    
    if (taskNames[i] !== '<idle>') {

     	// generating colors for non-cycle, non idle events
	    var style = document.createElement('style');
	    style.type = 'text/css';
	    var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
	    style.innerHTML = '.' + taskNames[i] + ' { fill: #' + color + '; }';
	    document.getElementsByTagName('head')[0].appendChild(style);
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

function calculateDurationBetweenSwitches(switchEvents)
{
	for (var i = 0; i < switchEvents.length - 1; i++) {
      var currEvent = switchEvents[i];
      currEvent.processTime = switchEvents[i + 1].startTime - currEvent.startTime;
    }

    // Set the duration of the last event to be 0, as we don't know the start time
    // of what happened after it
    switchEvents[switchEvents.length - 1].processTime = 0;

    return switchEvents;
}

// for each event, normalizes it relative to the cycle it is in.
function normalizeStartTime(switchCycleEvents, numCycles)
{
	//first group is unique
	var earliestTime = switchCycleEvents[0].startTime;
	var grouped = _.groupBy(switchCycleEvents, function(e){return e.cycle;});

	var newSwitchEvents = [];

	var eventsInFirstCycle = grouped[0];
	for (var i=0; i<eventsInFirstCycle.length; i++)
	{
		eventsInFirstCycle[i].normalStartTime = 
			eventsInFirstCycle[i].startTime - earliestTime;
	}

	newSwitchEvents = newSwitchEvents.concat(eventsInFirstCycle);

	//remaining groups
	for (var g=1; g<numCycles; g++)
	{
		var currEvents = grouped[g];
		earliestTime = cycleEvents[g-1].startTime;
		for (var i=0; i<currEvents.length; i++)
		{
			currEvents[i].normalStartTime = 
				currEvents[i].startTime - earliestTime;
		}

		newSwitchEvents = newSwitchEvents.concat(currEvents);
	}

	return newSwitchEvents;
}

// Calculate the total duration of all events in a list
function calculateDuration(eventList) {
  return _.reduce(eventList, function(sum, next) { return sum += next.duration; }, 0)
};

// finds the longest cycle for the chosen CPU
// to be used for Gantt charting
function getLongestCycleDuration(switchCycleEvents)
{
	
	var grouped = _.groupBy(switchCycleEvents, function(e){ return e.cycle; });

	return _.max(_.map(grouped, calculateDuration));
}

// Sorts events by cycle by assigning a "cycles" attribute
// uses the print markers in cycleEvents as "end points"
// compares startTime of event to startTime of a cycleEvent to determine
// what cycle it belongs to
// event.cycle is an integer.
function addCycleAttribute()
{
	var currEventIndex = 0; //events index

		var currCycle = 0;

		for (currCycle; currCycle<cycleEvents.length;currCycle++)
		{
			var currEvent = events[currEventIndex];
			while (currEvent.startTime < cycleEvents[currCycle].startTime)
			{
				currEvent.cycle = currCycle;
				currEventIndex++;
				currEvent = events[currEventIndex];
			}
		}
		//last thing special fun times
		for (currEventIndex; currEventIndex<event.length;currEventIndex++)
		{
			currEvent = events[currEventIndex];
			currEvent.cycle = currCycle;
		}
}

// adds each CPU to the select menu
// allows users to choose from all available CPUs
function addOptions()
{
	for (var i=0; i<numCPUs; i++)
	{
		var option = document.createElement("option");
		option.text = i;
		option.value = i;
		var select = document.getElementById("cpu");
		select.appendChild(option);
	}
}

 document.addEventListener("load", openDB());

// Handles user selection of new CPU from dropdown
 document.getElementById("cpu").onchange = function (e) {
 	currentCPU = e.target.value;
 }