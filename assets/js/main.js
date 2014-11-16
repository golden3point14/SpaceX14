var preemptionSorted;
var runTimesorted;
var waitTimesorted;

var JSONobj;

var JSONevents;
var JSONtasks;

var files;

var reader = new FileReader(); 

var db;

function handleFileSelect(evt) {
	files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');

    	reader.onload = function(evt) {

        

    		var contents = evt.target.result;
    		var obj = JSON.parse(contents);
  			var JSONObj = obj;
  			JSONtasks = obj.tasks;
        JSONevents = obj.events;

        openDB();

  			getTopPreemptions();
        getTopRuntime();
        getTopWaittime();
        attemptToFormatData();

		  };

    	reader.onerror = function(evt) {
    		console.error("File could not be read! Code " + evt.target.error.code);
		};

    reader.readAsText(f);

 	}

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

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
    var request = store.put(JSONevents, 1);
    var request2 = store2.put(JSONtasks, 1);

    // some kind of error handling
    request.onerror = function(e) {console.log("Error", e.target.error.name);}

    request.onsuccess = function(e) {console.log("added events");}

     // some kind of error handling
    request2.onerror = function(e) {console.log("Error", e.target.error.name);}

    request2.onsuccess = function(e) {console.log("added tasks");}

  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
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

function attemptToFormatData()
{
  var eventsGroupedByCPU = _.groupBy(JSONevents, function(e) { return e.cpu; });
  //console.log(eventsGroupedByCPU[0][1000]);
}
