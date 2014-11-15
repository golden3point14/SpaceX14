var values = [];    // the list of tasks
var maxRuntime = 0.0;  // the longest runtime
var minRuntime = Infinity;  // the shortest runtime
var maxPreemp = 0;  // the highest number of preemptions
var reader = new FileReader(); 
var doc = document;

var db; //for indexedDB
var JSONtasks;

function handleFileSelect(evt) {}

  // d3.json("test.json", function (data) { // getting the data from test.json
//   function handleFileSelect(evt) {
//     files = evt.target.files; // FileList object

//     var output = [];
//     for (var i = 0, f; f = files[i]; i++) {
//       output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
//                   f.size, ' bytes, last modified: ',
//                   f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
//                   '</li>');

//       reader.onload = function(evt) {
//         var contents = evt.target.result;
//         var data = JSON.parse(contents);

//         // console.log(data.tasks);

//         // filtering out the <idle> tasks, so that they don't show up in
//         // the histogram
//         for (var i=0; i<data.tasks.length; i++)
//         {
//             if (data.tasks[i].name !== "<idle>") {
//               values.push(data.tasks[i]);

//               // finding the max number of preemptions
//               if (data.tasks[i].totalRuntime > maxRuntime)
//               {
//                 maxRuntime = data.tasks[i].totalRuntime;
//               }

//               if (data.tasks[i].totalRuntime < minRuntime)
//               {
//                 minRuntime = data.tasks[i].totalRuntime;
//               }

//               // finding the max number of preemptions
//               if (data.tasks[i].preemptionCount > maxPreemp)
//               {
//                 maxPreemp = data.tasks[i].preemptionCount;
//               }
//             }
//         }

//         // creating a filter based on the preemption count
//         var value = crossfilter(values),
//           typeDimensionPreemp = value.dimension(function(d) {return d.preemptionCount;}),
//           pidDimension = value.dimension(function(d) {return d.pid;}),
//           typeGroupPreemp = typeDimensionPreemp.group().reduceCount(),
//           typeDimensionSleep = value.dimension(function(d) {return d.totalSleeptime;}),
//           typeGroupSleep = pidDimension.group().reduceCount(),
//           typeDimensionRun = value.dimension(function(d) {return d.pid;}),
//           typeGroupRun = pidDimension.group().reduceSum(function(d) {return d.totalRuntime;}),
//           typeDimensionWait = value.dimension(function(d) {return d.pid;}),
//           typeGroupWait = pidDimension.group().reduceSum(function(d) {return d.totalWaittime});

//         var dataTable = dc.dataTable("#process-list");  // the table of processes
//         var histogram = dc.rowChart("#dc-bar-chart");   // the histogram


//         dataTable
//           .width(300)
//           .height(500)
//           .dimension(typeDimensionSleep)
//           .group(
//             function(d) { 
//             console.log(d);
//             return "List of all selected processes";})
//           .columns([
//             function(d) {return d.name;},
//             function(d) {return d.totalRuntime;}
//             ])
//           .sortBy(function(d) {return -d.totalRuntime;})
//           .order(d3.ascending);

//         histogram
//           .width(700)
//           .height(values.length * 30)
//           .dimension(pidDimension)
//           .group(typeGroupRun)
//           .ordering(function(d) { 
//             console.log(d);
//             return -processFromPid(d.key, values).totalRuntime; })
//           .label(function(d) {
//             var process = processFromPid(d.key, values);
//             return process.name + "    " + process.totalRuntime + " ns"; 
//           })
//           .renderLabel(true)
//           .renderTitle(false);


//         // distribution side bar stuff
//         var histogrambutton = dc.barChart("#histogram-button");
//         var runchartbutton = dc.rowChart("#runchart-button");
//         var waitchartbutton = dc.rowChart("#waitchart-button");
//         var sleepchartbutton = dc.rowChart("#sleepchart-button");

//         var buttonwidth = 210;

//         histogrambutton
//           .width(buttonwidth)
//           .height(buttonwidth)
//           .x(d3.scale.linear().domain([0,maxPreemp]))
//           .brushOn(false)
//           .dimension(pidDimension)
//           .group(typeGroupPreemp);
          
//         histogrambutton.yAxis().tickFormat(function(v) { return ""; });    
//         histogrambutton.xAxis().tickFormat(function(v) { return ""; });

//         runchartbutton
//           .width(buttonwidth)
//           .height(values.length * 10)
//           .dimension(pidDimension)
//           .group(typeGroupRun)
//           .renderLabel(false)
//           .ordering(function(d) { return -processFromPid(d.key, values).totalRuntime; });

//         runchartbutton.xAxis().tickFormat(function(v) { return ""; });

//         waitchartbutton
//           .width(buttonwidth)
//           .height(values.length * 10)
//           .dimension(pidDimension)
//           .group(typeGroupWait)
//           .renderLabel(false)
//           .ordering(function(d) { return -processFromPid(d.key, values).totalWaittime; });

//         waitchartbutton.xAxis().tickFormat(function(v) { return ""; });

//         sleepchartbutton
//           .width(buttonwidth)
//           .height(values.length * 10)
//           .dimension(pidDimension)
//           .group(typeGroupSleep)
//           .renderLabel(false)
//           .ordering(function(d) { return -processFromPid(d.key, values).totalSleeptime; });

//         sleepchartbutton.xAxis().tickFormat(function(v) { return ""; });

//         // render the content
//         dc.renderAll();

//     };

//     reader.onerror = function(evt) {
//       console.error("File could not be read! Code " + evt.target.error.code);
//     };

//     reader.readAsText(f);

//   }

//   document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

// }

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

  // creating a filter based on the preemption count
  var value = crossfilter(values),
    typeDimensionPreemp = value.dimension(function(d) {return d.preemptionCount;}),
    pidDimension = value.dimension(function(d) {return d.pid;}),
    typeGroupPreemp = typeDimensionPreemp.group().reduceCount(),
    typeDimensionSleep = value.dimension(function(d) {return d.totalSleeptime;}),
    typeGroupSleep = pidDimension.group().reduceSum(function(d) {return d.totalSleeptime;}),
    typeDimensionRun = value.dimension(function(d) {return d.totalRuntime;}),
    typeGroupRun = pidDimension.group().reduceSum(function(d) {return d.totalRuntime;}),
    typeDimensionWait = value.dimension(function(d) {return d.pid;}),
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
      console.log(d);
      return -processFromPid(d.key, values).totalRuntime; })
    .label(function(d) {
      var process = processFromPid(d.key, values);
      return process.name + "    " + process.totalRuntime + " ns"; 
    })
    .renderLabel(true)
    .renderTitle(false);


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

