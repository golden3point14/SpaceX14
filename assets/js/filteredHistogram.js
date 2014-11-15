var values = [];    // the list of tasks
var maxPreemp = 0;  // the highest number of preemptions
var files;
var reader = new FileReader(); 
var doc = document;

var db; //for indexedDB
var JSONtasks;

  function handleFileSelect(evt) {}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

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

  for (var i=0; i<JSONtasks.length; i++)
  {
    if (JSONtasks[i].name !== "<idle>") {
      values.push(JSONtasks[i]);

      // finding the max number of preemptions
      if (JSONtasks[i].preemptionCount > maxPreemp)
      {
        maxPreemp = JSONtasks[i].preemptionCount;
      }
    }
  }

  // creating a filter based on the preemption count
  var value = crossfilter(values),
    typeDimensionPreemp = value.dimension(function(d) {return d.preemptionCount;}),
    pidDimension = value.dimension(function(d) {return d.pid;}),
    typeGroupPreemp = typeDimensionPreemp.group().reduceCount(),
    typeDimensionSleep = value.dimension(function(d) {return d.totalSleeptime;}),
    typeGroupSleep = pidDimension.group().reduceSum(function(d) {return d.totalSleeptime;}),
    typeDimensionRun = value.dimension(function(d) {return d.totalRuntime;}),
    typeGroupRun = pidDimension.group().reduceSum(function(d) {return d.totalRuntime;}),
    typeDimensionWait = value.dimension(function(d) {return d.totalWaittime;}),
    typeGroupWait = pidDimension.group().reduceSum(function(d) {return d.totalWaittime});


  var dataTable = dc.dataTable("#process-list");  // the table of processes
  var histogram = dc.barChart("#dc-bar-chart");   // the histogram

  dataTable
    .width(300)
    .height(500)
    .dimension(typeDimensionPreemp)
    .group(function(d) { return "List of all selected processes"})
    .columns([
      function(d) {return d.name;},
      function(d) {return d.preemptionCount;}
      ])
    .sortBy(function(d) {return -d.preemptionCount;})
    .order(d3.ascending);

  histogram
    .width(700)
    .height(400)
    .x(d3.scale.linear().domain([0,maxPreemp + 2]))
    .brushOn(true)
    .dimension(typeDimensionPreemp)
    .group(typeGroupPreemp)
    .renderHorizontalGridLines(true)
    .xAxisLabel("Preemption Count")
    .yAxisLabel("Number of Processes");


  // distribution side bar stuff
  var histogrambutton = dc.barChart("#histogram-button");
  var runchartbutton = dc.rowChart("#runchart-button");
  var waitchartbutton = dc.rowChart("#waitchart-button");
  var sleepchartbutton = dc.rowChart("#sleepchart-button");

  var buttonwidth = 210;

  histogrambutton
    .width(buttonwidth)
    .height(buttonwidth)
    .x(d3.scale.linear().domain([0,maxPreemp]))
    .brushOn(false)
    .dimension(pidDimension)
    .group(typeGroupPreemp);
    
  histogrambutton.yAxis().tickFormat(function(v) { return ""; });    
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
