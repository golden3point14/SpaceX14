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
      getTopRunTime();
      GetTopWaitTime();

		};

    	reader.onerror = function(evt) {
    		console.error("File could not be read! Code " + evt.target.error.code);
		};

    reader.readAsText(f);

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

function getTopRunTime()
{

}

function getTopWaitTime()
{

}