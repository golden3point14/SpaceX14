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
	//sort processes by preemptionCount
 	preemptionSorted = _.sortBy(JSONtasks, function(element){return element.preemptionCount;});
 	//remove <idle>
 	preemptionSorted = _.select(preemptionSorted, function(element){return element.name != "<idle>";});
 	for (var i=0; i<preemptionSorted.length; i++)
 	{
 		console.log(preemptionSorted[i].name + " " + preemptionSorted[i].preemptionCount);
 	}
 	//sort processes by totalRunTime
 	//sort processes by totalWaitTime

 	//get top 10 most preempted (ignore idle)
 	//get top 10 longest runtime (ignore idle)
 	//get top 10 longest waittime (ignore idle)
}