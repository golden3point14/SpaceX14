var values = [];    // the list of tasks
var maxRuntime = 0.0;  // the longest runtime
var minRuntime = Infinity;  // the shortest runtime
var maxPreemp = 0;  // the highest number of preemptions
var reader = new FileReader(); 
var doc = document;

var db; //for indexedDB
var JSONtasks;

function processFromPid(pid, values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i].pid == pid) {

      return values[i];
    }
  }

  return "";
}

document.addEventListener("DOMContentLoaded", openDB());

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

    //get data
    var xact = db.transaction(["Tasks"], "readonly");
    var objectStore = xact.objectStore("Tasks");
    var ob = objectStore.get(1); //temporary hard-coded
    ob.onsuccess = function(e) { console.log("e is the JSONtasks");
                                 console.log(e.target.result);
                                 JSONtasks = e.target.result;
                                 useDatabaseData();
                               }
    
  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
}

function useDatabaseData()
{
  console.log("using the runtime data");
  for (var i=0; i<JSONtasks.length; i++)
  {
      if (JSONtasks[i].name !== "<idle>") {
        values.push(JSONtasks[i]);

        // finding the max number of preemptions
        if (JSONtasks[i].totalRuntime > maxRuntime)
        {
          maxRuntime = JSONtasks[i].totalRuntime;
        }

        if (JSONtasks[i].totalRuntime < minRuntime)
        {
          minRuntime = JSONtasks[i].totalRuntime;
        }

        // finding the max number of preemptions
        if (JSONtasks[i].preemptionCount > maxPreemp)
        {
          maxPreemp = JSONtasks[i].preemptionCount;
        }
      }
  }

  var avg = calculateAverage(JSONtasks, "totalRuntime");
  var stdDev = calculateStdDev(JSONtasks, "totalRuntime", avg);
  document.getElementById("mean").innerHTML = Math.round(avg);
  document.getElementById("stddev").innerHTML = Math.round(stdDev);

  // creating a the filters and groups from the data
  var value = crossfilter(values),
    pidDimension = value.dimension(function(d) {return d.pid;}),
    typeDimensionPreemp = value.dimension(function(d) {return d.preemptionCount;}),
    typeGroupPreemp = pidDimension.group().reduceSum(function(d) {return d.preemptionCount;}),
    typeDimensionSleep = value.dimension(function(d) {return d.totalSleeptime;}),
    typeGroupSleep = pidDimension.group().reduceSum(function(d) {return d.totalSleeptime;}),
    typeDimensionRun = value.dimension(function(d) {return d.totalRuntime;}),
    typeGroupRun = pidDimension.group().reduceSum(function(d) {return d.totalRuntime;}),
    typeDimensionWait = value.dimension(function(d) {return d.totalWaittime;}),
    typeGroupWait = pidDimension.group().reduceSum(function(d) {return d.totalWaittime});

  var dataTable = dc.dataTable("#process-list");  // the table of processes
  var histogram = dc.rowChart("#dc-bar-chart");   // the histogram


  dataTable
    .width(300)
    .height(500)
    .dimension(typeDimensionRun)
    .group(
      function(d) { 
      console.log(d);
      return "List of all selected processes";})
    .columns([
      function(d) {return d.name;},
      function(d) {return d.totalRuntime;}
      ])
    .sortBy(function(d) {return -d.totalRuntime;})
    .order(d3.ascending);


  histogram
    .width(700)
    .height(values.length * 30)
    .dimension(pidDimension)
    .group(typeGroupRun)
    .ordering(function(d) { 
      return -processFromPid(d.key, values).totalRuntime; })
    .label(function(d) {
      var process = processFromPid(d.key, values);
      return process.name + "    (" + process.totalRuntime / 1000000 + " ms)"; 
    })
    .renderLabel(true)
    .renderTitle(false);

  histogram.filter = function() {};


  // distribution side bar stuff
  var histogrambutton = dc.rowChart("#histogram-button");
  var runchartbutton = dc.rowChart("#runchart-button");
  var waitchartbutton = dc.rowChart("#waitchart-button");
  var sleepchartbutton = dc.rowChart("#sleepchart-button");

  var buttonwidth = 210;

  histogrambutton
    .width(buttonwidth)
    .height(values.length * 10)
    .dimension(pidDimension)
    .group(typeGroupPreemp)
    .renderLabel(false)
    .ordering(function(d) { return -processFromPid(d.key, values).preemptionCount; });
       
  histogrambutton.xAxis().tickFormat(function(v) { return ""; });

  runchartbutton
    .width(buttonwidth)
    .height(values.length * 10)
    .dimension(pidDimension)
    .group(typeGroupRun)
    .renderLabel(false)
    .ordering(function(d) { return -processFromPid(d.key, values).totalRuntime; });

  runchartbutton.xAxis().tickFormat(function(v) { return ""; });

  waitchartbutton
    .width(buttonwidth)
    .height(values.length * 10)
    .dimension(pidDimension)
    .group(typeGroupWait)
    .renderLabel(false)
    .ordering(function(d) { return -processFromPid(d.key, values).totalWaittime; });

  waitchartbutton.xAxis().tickFormat(function(v) { return ""; });

  sleepchartbutton
    .width(buttonwidth)
    .height(values.length * 10)
    .dimension(pidDimension)
    .group(typeGroupSleep)
    .renderLabel(false)
    .ordering(function(d) { return -processFromPid(d.key, values).totalSleeptime; });

  sleepchartbutton.xAxis().tickFormat(function(v) { return ""; });

  // render the content
  dc.renderAll();
}

