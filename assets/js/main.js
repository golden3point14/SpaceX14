var preemptionSorted;
var runTimesorted;
var waitTimesorted;

var JSONobj;

var JSONevents;
var JSONtasks;

var files;

var reader = new FileReader(); 

var db;

var switchEvents;
var maxDuration;

function openDB()
{
  var openRequest = indexedDB.open("events", 2);

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
    

  }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    db = e.target.result;

    var xact = db.transaction(["Events"],"readwrite");
    var xact2 = db.transaction(["Tasks"], "readwrite");
    var store = xact.objectStore("Events");
    var store2 = xact2.objectStore("Tasks");
    var result = store.get(1);
    var result2 = store2.get(1);

    // some kind of error handling
    result.onerror = function(e) {console.log("Error", e.target.error.name);}

    result.onsuccess = function(e) {JSONevents = e.target.result;}

     // some kind of error handling
    result2.onerror = function(e) {console.log("Error", e.target.error.name);}

    result2.onsuccess = function(e) {JSONtasks = e.target.result;
                                    getTopPreemptions();
                                    getTopRuntime();
                                    getTopWaittime();
                                    //attemptToFormatData();

                                    var cpus = [0, 1, 2, 3];
                                    var gantt = d3.gantt().taskTypes(cpus);
                                    switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
                                    getLongestCPUDuration();
                                    gantt(switchEvents);
    }

  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e); }
}

function getTopPreemptions()
{

  //JSONtasks = _.select(JSONtasks, function(element){return element.name != "<idle>";});

	//sort processes by preemptionCount
 	preemptionSorted = _.sortBy(JSONtasks, function(element){return -1*(element.preemptionCount);});
 	//remove <idle>
 	preemptionSorted = _.select(preemptionSorted, function(element){return (element.name != "<idle>") && (element.preemptionCount != 0);});
 	
  var displayNum = 10;
  var display = [];
  if (preemptionSorted.length < displayNum)
  {
    display = preemptionSorted;
  }
  else
  {
    display = preemptionSorted.slice(0,displayNum);
  }

  var value = crossfilter(display),
    typeDimension = value.dimension(function(d) {return d.preemptionCount;}),
    nameDimension = value.dimension(function(d) {return d.pid;}),
    nameGroup = nameDimension.group().reduceSum(function(d) {return 5}),
    typeGroup = typeDimension.group().reduceCount();

  var dataTable = dc.dataTable("#preemption-list");
    
  dataTable
    .width(300)
    .height(400)
    .dimension(typeDimension)
    .group(function(d) { return "top 10 most preempted"})
    .columns([
      function(d) {return d.name;},
      function(d) {return d.pid;},
      function(d) {return d.preemptionCount;}
      ])
    .sortBy(function(d) {return -1*d.preemptionCount;})
    .order(d3.ascending);

  dc.renderAll();
}

function getTopRuntime()
{
  //sort processes by preemptionCount
  runTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalRuntime);});
  //remove <idle>
  runTimeSorted = _.select(runTimeSorted, function(element){return (element.name != "<idle>") && (element.totalRuntime != 0);});
  
  var displayNum = 10;
  var display = [];
  if (runTimeSorted.length < displayNum)
  {
    display = runTimeSorted;
  }
  else
  {
    display = runTimeSorted.slice(0,displayNum);
  }

  var value = crossfilter(display),
    typeDimension = value.dimension(function(d) {return d.totalRuntime;}),
    nameDimension = value.dimension(function(d) {return d.pid;}),
    nameGroup = nameDimension.group().reduceSum(function(d) {return 5}),
    typeGroup = typeDimension.group().reduceCount();

  var dataTable = dc.dataTable("#runtime-list");
    
  dataTable
    .width(300)
    .height(400)
    .dimension(typeDimension)
    .group(function(d) { return "10 longest running";})
    .columns([
      function(d) {return d.name;},
      function(d) {return d.pid;},
      function(d) {return d.totalRuntime;}
      ])
    .sortBy(function(d) {return -1*d.totalRuntime;})
    .order(d3.ascending);

  dc.renderAll();
}

function getTopWaittime()
{
  //sort processes by preemptionCount
  waitTimeSorted = _.sortBy(JSONtasks, function(element){return -1*(element.totalWaittime);});
  //remove <idle>
  waitTimeSorted = _.select(waitTimeSorted, function(element){return (element.name != "<idle>") && (element.totalWaittime != 0);});
  
  var displayNum = 10;
  var display = [];
  if (waitTimeSorted.length < displayNum)
  {
    display = waitTimeSorted;
  }
  else
  {
    display = waitTimeSorted.slice(0,displayNum);
  }

  var value = crossfilter(display),
    typeDimension = value.dimension(function(d) {return d.totalWaittime;}),
    nameDimension = value.dimension(function(d) {return d.pid;}),
    nameGroup = nameDimension.group().reduceSum(function(d) {return 5}),
    typeGroup = typeDimension.group().reduceCount();

  var dataTable = dc.dataTable("#waittime-list");
    
  dataTable
    .width(300)
    .height(400)
    .dimension(typeDimension)
    .group(function(d) { return "10 longest waiting";})
    .columns([
      function(d) {return d.name;},
      function(d) {return d.pid;},
      function(d) {return d.totalWaittime;}
      ])
    .sortBy(function(d) {return -1*d.totalWaittime;})
    .order(d3.ascending);

  dc.renderAll();
}

function getLongestCPUDuration()
{

  numCPU = 4;
  switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
  switchEvents = _.groupBy(switchEvents, function(e){return e.cpu;});
  maxDuration = 0;
  for (var j = 0; j < numCPU; j++)
  {
    var sum = _.reduce(switchEvents[j], function(first, second) { return first.duration + second.duration }, 0);
    if (sum > maxDuration) {
      maxDuration = sum
    }
  }
}

// filters on switch events and calculates their durations
function attemptToFormatData()
{
  //FIXME we need to care about which CPU a thing is on

  //HARDCODED FOR NOW FIXME
  var numCPU = 4;

  //switch these and find last event per cpu FIXME
  switchEvents = _.filter(JSONevents, function(e){return e.eventType === "sched_switch";});
  switchEvents = _.groupBy(switchEvents, function(e){return e.cpu;});

  console.log(switchEvents);

  for (var j = 0; j < numCPU; j++)
  {
    var lastIndex = switchEvents[j].length-1;
    
    for (var i = 0; i < lastIndex; i++)
    {
      switchEvents[j][i].duration = switchEvents[j][i+1].startTime - switchEvents[j][i].startTime;
    }

      //LAST ONE GETS SPECIAL TREATMENT
      //PROBLEM: uses last one not of last CPU
      switchEvents[j][lastIndex].duration = JSONevents[JSONevents.length-1].startTime -
                                                      switchEvents[j][lastIndex].startTime;
  }
  console.log(switchEvents);
}

document.addEventListener("load", openDB());
