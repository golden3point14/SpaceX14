var values = [];    // the list of tasks
var maxPreemp = 0;  // the highest number of preemptions
var files;
var reader = new FileReader(); 
var doc = document;

var db; //for indexedDB
var JSONtasks;
var colors = [];

$('#statisticsButton').css('background-color', '#315B7E');
$('#histogram-button').css('background-color', '#315B7E');

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

  openRequest.onsuccess = function(e)
  {
    db = e.target.result;

    //get data
    var xact = db.transaction(["Tasks"], "readonly");
    var objectStore = xact.objectStore("Tasks");
    var ob = objectStore.get(1); //temporary hard-coded
    ob.onsuccess = function(e) {
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
  setColoringOfTasks();
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

  var avg = calculateAverage(values, "preemptionCount");
  var stdDev = calculateStdDev(values, "preemptionCount", avg);
  document.getElementById("mean").innerHTML = (avg).toFixed(5);
  document.getElementById("stddev").innerHTML = (stdDev).toFixed(5);

  // creating a the filters and groups from the data
  var value = crossfilter(values),
    pidDimension = value.dimension(function(d) {return d.pid;}),
    typeDimensionPreemp = value.dimension(function(d) {return d.preemptionCount;}),
    typeGroupPreemp = pidDimension.group().reduceSum(function(d) {return d.preemptionCount;}),
    typeDimensionRun = value.dimension(function(d) {return d.totalRuntime;}),
    typeGroupRun = pidDimension.group().reduceSum(function(d) {return d.totalRuntime;});


  var dataTable = dc.dataTable("#process-list");  // the table of processes
  var histogram = dc.rowChart("#dc-bar-chart");   // the bar chart

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
    .height(values.length * 30)
    .dimension(pidDimension)
    .group(typeGroupPreemp)
    .ordering(function(d) { return -processFromPid(d.key, values).preemptionCount; })
    .label(function(d) {
      var process = processFromPid(d.key, values);
      return process.name + "    (" + process.preemptionCount + " preemptions)"; 
    })
    .renderLabel(true)
    .title(function(d) {
      var process = processFromPid(d.key, values);
      return process.name + "\n" + process.preemptionCount + " preemptions";
    })
    .renderTitle(false)
    .colorCalculator(function(d,i){
      var process = processFromPid(d.key, values);
      return "#" + colors[process.name];
    })
    .margins({top: 0, right: 0, bottom: -1, left: 10});

  histogram.onClick = function(d) {
    var processname = processFromPid(d.key, values).name;
    var cellData = processname + ", PID: "+d.key;
    window.localStorage.setItem("cellData", cellData);
    window.location.href = "process.html";
  };

  // distribution side bar stuff
  var histogrambutton = dc.rowChart("#histogram-button");
  var runchartbutton = dc.rowChart("#runchart-button");


  var buttonwidth = 210;

  histogrambutton
    .width(buttonwidth)
    .height(values.length * 10)
    .dimension(pidDimension)
    .group(typeGroupPreemp)
    .renderLabel(false)
    .colorCalculator(function(d,i){
      var process = processFromPid(d.key, values);
      return "#" + colors[process.name];
    })
    .ordering(function(d) { return -processFromPid(d.key, values).preemptionCount; });
       
  histogrambutton.xAxis().tickFormat(function(v) { return ""; });

  runchartbutton
    .width(buttonwidth)
    .height(values.length * 10)
    .dimension(pidDimension)
    .group(typeGroupRun)
    .renderLabel(false)
    .colorCalculator(function(d,i){
      var process = processFromPid(d.key, values);
      return "#" + colors[process.name];
    })
    .ordering(function(d) { return -processFromPid(d.key, values).totalRuntime; });

  runchartbutton.xAxis().tickFormat(function(v) { return ""; });


  // render the content
  dc.renderAll();
}

function setColoringOfTasks() {
  // For each task, create a CSS class with a random color
  Math.seedrandom('hello.');

  for (var i = 0; i < JSONtasks.length; i++) {
    
    if (JSONtasks[i].name !== '<idle>') {
        var color = ('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)
        colors[JSONtasks[i].name] = color;
    }
  } 
}

