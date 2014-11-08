var preemptionSorted;
var runTimesorted;
var waitTimesorted;

var JSONobj;

var JSONevents;
var JSONtasks;

var files;

var reader = new FileReader(); 

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
    			console.log("First event is " + obj.events[0].name);
			var JSONObj = obj;
			JSONtasks = obj.tasks;
			getTopPreemptions();
      getTopRuntime();
      getTopWaittime();

		};

    	reader.onerror = function(evt) {
    		console.error("File could not be read! Code " + evt.target.error.code);
		};

    reader.readAsText(f);

 	}

  if (supports_html5_storage()) 
  {
    console.log("localstorage supported");
  } 
  else 
  {
    console.log("no");
  }

}

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);

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
    .width(500)
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
    .width(500)
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