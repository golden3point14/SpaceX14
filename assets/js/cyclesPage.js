var numCPUs;
var cycleEvents;
var events;
var currentCPU = 0;
var chartType = "CYCLES"
var taskNames;
var numCycles;
var gantt;

$('#cyclesButton').css('background-color', '#315B7E');

function openDB()
{
	var openRequest = indexedDB.open("events", 8);

	openRequest.onsuccess = function(e)
	{
		console.log("openRequest success!");
		db = e.target.result;

		//get data

		var numCPUsRequest = db.transaction(["numCPUs"], "readonly")
	    					.objectStore("numCPUs").get(1);

	    var cyclesRequest = db.transaction(["cycleEvents"], "readonly")
	    					.objectStore("cycleEvents").get(1);

	    var eventsRequest = db.transaction(["Events"],"readonly")
	    					.objectStore("Events").get(1);

		//error handling
		numCPUsRequest.onerror = function(e) {console.log("error", e.target.error.name);}

		//success
		numCPUsRequest.onsuccess = function(e)
		{
			numCPUs = e.target.result;
			addOptions();

			cyclesRequest.onerror = function(e){console.log("error", e.target.error.name);}
			
      // Get cycle events
			cyclesRequest.onsuccess = function(e)
			{			
				cycleEvents = e.target.result;

				eventsRequest.onerror = function(f){console.log("error", f.target.error.name);}
				
        // Get events
				eventsRequest.onsuccess = function(f)
				{
					events = f.target.result;

					var taskNamesRequest = db.transaction(["AutocompleteNames"], "readonly")
                                   .objectStore("AutocompleteNames").get(1);

					taskNamesRequest.onerror = function(h) {console.log("error", h.target.error.name);}

          // get list of task names
					taskNamesRequest.onsuccess = function(h)
					{
            // User print markers existed
            if (cycleEvents && cycleEvents.length != 0) {
              makeGantt();
            } 

						taskNames = h.target.result;

						setColoringOfTasks();

            $('.loader').fadeOut("slow");
					}
				}
			}
		}
	}
}

function makeGantt() {
  // Remove an old chart if it exists
  d3.selectAll("svg").remove();
  numCycles = cycleEvents.length;

  // Categorize all events into cycles
  addCycleAttribute();

  // Only use switch events on the chart, after
  // normalizing their start times within their cycles
  // and calculating the durations between them
  var switchCycleEvents = getCycleEventsForCPU();

  timeDomainEnd = getLongestCycleDuration(switchCycleEvents);

  var margin = {
    top: 20,
    right: 40,
    bottom: 20,
    left: 70
  }

  var height = (numCycles + 1) * 35;
  gantt = d3.gantt(chartType).taskTypes(_.range(numCycles,-1,-1))
          .timeDomain(timeDomainEnd).yAttribute("cycle").yLabel("Cycle ").margin(margin).height(height);

  gantt(switchCycleEvents);
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

		// Loop through all cycles, comparing the start time of the cycle
		// to the start time of events to cateogorize events
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
		// All remaining events go into the last cycle
		for (currEventIndex; currEventIndex<events.length;currEventIndex++)
		{
			currEvent = events[currEventIndex];
			currEvent.cycle = currCycle;
		}
}

function getCycleEventsForCPU() {
	var switchCycleEvents = _.filter(events, function(e){ return e.cpu == currentCPU && e.eventType === "sched_switch"; });
	
	switchCycleEvents = normalizeStartTime(switchCycleEvents, numCycles);

	switchCycleEvents = calculateDurationBetweenSwitches(switchCycleEvents);

	return switchCycleEvents;
}

// for each event, normalizes it relative to the cycle it is in.
function normalizeStartTime(switchCycleEvents, numCycles)
{
	var grouped = _.groupBy(switchCycleEvents, function(e){return e.cycle;});
	var newSwitchEvents = [];

	//remaining groups
	for (var cycleNum in grouped)
	{

		if (grouped.hasOwnProperty(cycleNum)) {
			var currEvents = grouped[cycleNum];

			// For first cycle, shift everything by the start time so that
			// we begin at 0. Later cycles shifted by the end time of previous
			// cycle.
			if (cycleNum === "0") {
				earliestTime = switchCycleEvents[0].startTime;
			} else {
				earliestTime = cycleEvents[cycleNum - 1].startTime;
			}
		
			for (var i=0; i<currEvents.length; i++)
			{
				currEvents[i].normalStartTime = 
				currEvents[i].startTime - earliestTime;
			}

			newSwitchEvents = newSwitchEvents.concat(currEvents);
		}
		
	}

	return newSwitchEvents;
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

function setColoringOfTasks() {
  Math.seedrandom("hello.");

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

// Calculate the total duration of all events in a list
function calculateDuration(eventList) {
  
  //var earliestEventTime = eventList[0].normalStartTime;

  return _.reduce(eventList, function(sum, next) { return sum += next.processTime; }, 0);
  			//+ earliestEventTime;
 }

// finds the longest cycle for the chosen CPU
// to be used for Gantt charting
function getLongestCycleDuration(switchCycleEvents)
{
	
	var grouped = _.groupBy(switchCycleEvents, function(e){ return e.cycle; });

	return _.max(_.map(grouped, calculateDuration));
}

// adds each CPU to the select menu
// allows users to choose from all available CPUs
function addOptions()
{
	for (var i=0; i<numCPUs; i++	)
	{
		var option = document.createElement("option");
		option.text = i;
		option.value = i;
		var select = document.getElementById("cpu");
		select.appendChild(option);
	}
}

// Handles user selection of new CPU from dropdown
document.getElementById("cpu").onchange = function (e) {
  currentCPU = e.target.value;
  var switchCycleEvents = getCycleEventsForCPU();
  d3.selectAll("svg").remove();
  gantt(switchCycleEvents);
}

function calculateSimpleDuration(eventList) {
  return _.reduce(eventList, function(sum, next) { return sum += next.duration; }, 0);
}

function getLongestCPUDuration(events)
{
  eventsByCPU = _.groupBy(events, function(e){return e.cpu;});

  return _.max(_.map(eventsByCPU, calculateSimpleDuration));
}

function getCycleLength(e)
 {
 	//check if enter was hit
 	if(e.keyCode == 13)
 	{
 		e.preventDefault();

    var cycleInput = document.getElementById("cycleLength");

    // Make sure user typed a valid number
    if (cycleInput.checkValidity()) {
      var cycleLength = parseFloat(cycleInput.value);

      if (cycleLength == 0) {
        return;
      }

      // Cycle markers do not start at time 0, as we use the cycle
      // start time to sort events into cycles, so no events
      // would be in that cycle
      var nextStartTime = events[0].startTime + cycleLength;
      // startTime is in seconds since kernel startup. We need to compare
      // against the duration of the longest cycle, which is just in
      // seconds, so track both.
      var normalizedStartTime = cycleLength;

      var endTime = getLongestCPUDuration(events);

      // Clear out cycle events so that more aren't added on entry of
      // a different number
      cycleEvents = [];

      // End time is a duration in seconds, so compare to our normalized time
      while (normalizedStartTime < endTime) {
        // but our mocked up cycle event expects time in seconds since
        // kernel startup
        var newCycle = {"startTime" : nextStartTime};
        cycleEvents.push(newCycle);
        nextStartTime += cycleLength;
        normalizedStartTime += cycleLength;
      }
     
      makeGantt();
    }
 	}
}

document.addEventListener("load", openDB());
document.getElementById("cycleLength").addEventListener("keypress", getCycleLength)
