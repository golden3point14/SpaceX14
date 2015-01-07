var files;
var d,j;
var eventJSON;
var currentResults;
var reader = new FileReader();

  function displayTable() {
	$(document).ready(function() {
	var data = [];
	for ( var i=0 ; i<currentResults.length ; i++ ) {
    if(currentResults[i].name=="<idle>") {
      currentResults[i].name='idle';
    } 
	data.push( [ currentResults[i].cpu, currentResults[i].startTime, currentResults[i].name, currentResults[i].pid, currentResults[i].eventType, currentResults[i].extraInfo ] );
	}

	var oTable = $('#table_id').dataTable( {
		data:           data,
		deferRender:    true,
		dom:            "frtiS",
		scrollY:        450,
		scrollCollapse: true,
		order: [[1, 'asc']]
		} );
	} );
  }

  //pulls the data from the IndexedDB and displays it
  function openDB()
  {
    var openRequest = indexedDB.open("events", 4);
    console.log("in search.js");


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
    var xact = db.transaction(["Events"], "readonly");
    var objectStore = xact.objectStore("Events");
    var ob = objectStore.get(1); //temporary hard-coded
    ob.onsuccess = function(e) {console.log("e is the JSONevents");
                                //console.log(e.target.result);
                                eventJSON = e.target.result;
                                currentResults = eventJSON;
                                console.log("currentResults.length:"+currentResults.length);
                                displayTable();
                                autoComplete();
						                  }
    
  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
}

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substrRegex;
 
    // an array that will be populated with substring matches
    matches = [];
 
    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');
 
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });
 
    cb(matches);
  };
};
 
var states = ['sched_wakeup', 'sched_switch', 'sched_migrate_task', 'sched_stat_runtime',
              'sched_stat_sleep', 'softirq_entry', 'softirq_raise', 'softirq_exit'
];
 
function autoComplete() {
$('input').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'states',
  displayKey: 'value',
  source: substringMatcher(states)
});
}

document.addEventListener("load", openDB());
