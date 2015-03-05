var numCPUs;
var cycleEvents;
var events;
var chartType = "CYCLES"
var taskNames;
var numCycles;
var currentLoaded = 50;
var isSearch = false;
var selectedCPUs = [];

document.getElementById('cyclesButton').style.backgroundColor = '#315B7E';

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
            selectedCPUs = JSON.parse(window.localStorage.getItem("displayedCPUs"));
            if (!selectedCPUs) {
              selectedCPUs = _.range(numCPUs);
            }

            // Add checkboxes at top to toggle displaying charts for each CPU
            addOptions();

            // User print markers existed
            if (cycleEvents && cycleEvents.length != 0) {
              drawAllCharts();
            } 

						taskNames = h.target.result;

						setColoringOfTasks();

            document.getElementById('loader').style.display = "none";
					}
				}
			}
		}
	}
}

function drawAllCharts() {
  for (var i = 0; i < selectedCPUs.length; i++) {
    // Remove old charts, which will be resized if something has changed
    var chart = document.getElementById("ganttChart" + selectedCPUs[i]);
    if (chart) {
      chart.parentNode.removeChild(chart);
    }

    // Draw chart
    makeGantt(selectedCPUs[i]);
  }
}

function makeGantt(currentCPU) {
  numCycles = cycleEvents.length;

  // Categorize all events into cycles
  addCycleAttribute();

  // Only use switch events on the chart, after
  // normalizing their start times within their cycles
  // and calculating the durations between them
  var switchCycleEvents = getCycleEventsForCPU(currentCPU);

  timeDomainEnd = getLongestCycleDuration(switchCycleEvents);

  var margin = {
    top: 20,
    right: 40,
    bottom: 20,
    left: 70
  }

  var height = (numCycles + 1) * 35;
  // Divide window up by number of CPUs displayed. 80 is to deal with set size of sidebar
  // Each chart div has a margin of 20px, so also subtract this off
  var numDisplayed = selectedCPUs.length;
  var width = (document.body.clientWidth / selectedCPUs.length) - 80 - margin.right - margin.left - 20 * numDisplayed;
  var gantt = d3.gantt(chartType).taskTypes(_.range(numCycles,-1,-1))
          .timeDomain(timeDomainEnd).yAttribute("cycle").yLabel("Cycle ").margin(margin)
          .height(height)
          .width(width);

  // Create a new div for this chart and place it inside our div for all gantt charts
  var chartDiv = document.createElement("div");
  chartDiv.id = "ganttChart" + currentCPU;
  chartDiv.style.display = "inline-block";
  chartDiv.style.marginLeft = "20px";

  document.getElementById("ganttCharts").appendChild(chartDiv);
  var chartID = '#ganttChart' + currentCPU;

  gantt(switchCycleEvents, chartID);
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

function getCycleEventsForCPU(currentCPU) {
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

// adds each CPU as a checkbox
// allows users to choose from all available CPUs
function addOptions()
{
	for (var i = 0; i < numCPUs; i++	)
	{
		var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = i;
		checkbox.value = i;
    if (selectedCPUs.indexOf(i) > -1) {
      checkbox.checked = true;
    }
    
    var label = document.createElement("label");
    label.className = "checkbox cpu-checkbox";
    label.appendChild(document.createTextNode("CPU " + i));
    label.appendChild(checkbox);

		var container = document.getElementById("cpu-checkboxes");
		container.appendChild(label);

    checkbox.onclick = function() {
      if (this.checked) {
        // Update our list of currently selected CPUs, keep in sorted order
        selectedCPUs.push(parseInt(this.value));
        selectedCPUs = _.sortBy(selectedCPUs, function(num) { return num });
        window.localStorage.setItem("displayedCPUs", JSON.stringify(selectedCPUs));

      } else {
        var chart = document.getElementById("ganttChart" + this.value);
        chart.parentNode.removeChild(chart);

        // Update our list of currently selected CPUs
        selectedCPUs.splice(selectedCPUs.indexOf(parseInt(this.value)), 1);
        window.localStorage.setItem("displayedCPUs", JSON.stringify(selectedCPUs));
      }
      drawAllCharts();
    }
	}
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

    var cycleInput = document.getElementById("cycleLength1");

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
     
      drawAllCharts();
    }
 	}
}

document.addEventListener("load", openDB());
document.getElementById("cycleLength1").addEventListener("keypress", getCycleLength)
