var values = [];    // the list of tasks
var maxSleeptime = 0.0;  // the longest runtime
var minSleeptime = Infinity;  // the shortest runtime
var maxPreemp = 0;  // the highest number of preemptions
var reader = new FileReader(); 
var doc = document;

var db; //for indexedDB
var JSONtasks;

$('#statisticsButton').css('background-color', '#315B7E');
$('#sleepchart-button').css('background-color', '#315B7E');

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
    var tasksRequest = db.transaction(["Tasks"], "readonly")
                .objectStore("Tasks").get(1);
    
    tasksRequest.onerror = function(e) {console.log("error", e.target.error.name);}
    
    tasksRequest.onsuccess = function(e) {
                                 JSONtasks = e.target.result;
                                 useDatabaseData();
                               }
    
  }

}


function useDatabaseData() {
  console.log("using the sleep data");
  for (var i=0; i<JSONtasks.length; i++)
  {
      if (JSONtasks[i].name !== "<idle>") {
        values.push(JSONtasks[i]);

        // finding the max number of preemptions
        if (JSONtasks[i].totalSleeptime > maxSleeptime)
        {
          maxSleeptime = JSONtasks[i].totalSleeptime;
        }

        if (JSONtasks[i].totalSleeptime < minSleeptime)
        {
          minSleeptime = JSONtasks[i].totalSleeptime;
        }

        // finding the max number of preemptions
        if (JSONtasks[i].preemptionCount > maxPreemp)
        {
          maxPreemp = JSONtasks[i].preemptionCount;
        }
      }
  }

  var avg = calculateAverage(values, "totalSleeptime");
  var stdDev = calculateStdDev(values, "totalSleeptime", avg);
  document.getElementById("mean").innerHTML = (avg / 1000000).toFixed(5);
  document.getElementById("stddev").innerHTML = (stdDev / 1000000).toFixed(5);

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
    .dimension(typeDimensionSleep)
    .group(function(d) { return "List of all selected processes"})
    .columns([
      function(d) {return d.name;},
      function(d) {return d.totalSleeptime;}
      ])
    .sortBy(function(d) {return -d.totalSleeptime;})
    .order(d3.ascending);

  histogram
    .width(700)
    .height(values.length * 30)
    .dimension(pidDimension)
    .group(typeGroupSleep)
    .ordering(function(d) { return -processFromPid(d.key, values).totalSleeptime; })
    .label(function(d) {
      var process = processFromPid(d.key, values);
      return process.name + "    (" + process.totalSleeptime / 1000000 + " ms)"; 
    })
    .renderLabel(true)
    .renderTitle(false)
    .margins({top: 0, right: 0, bottom: -1, left: 10});

  // histogram.filter = function() {};
  histogram.onClick = function(d) {
    // console.log("clicked on the chart");
    // console.log(processFromPid(d.key, values).name);
    window.localStorage.setItem("cellData", processFromPid(d.key, values).name);
    window.location.href = "process.html";
  };


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