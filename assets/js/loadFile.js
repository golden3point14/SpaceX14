var JSONobj;

var JSONevents;
var JSONtasks;

var files;

var reader = new FileReader(); 

var db;

var JSONnumCPUs;

var JSONautocompleteEventTypes;
var JSONautocompleteNames;
var JSONcycleEvents;

window.localStorage.setItem("cellData", "");

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
        	JSONnumCPUs = obj.numCPU;
        	JSONautocompleteEventTypes = obj.autocompleteEventTypes;
        	JSONautocompleteNames = obj.autocompleteNames;
        	JSONcycleEvents = obj.cycleEvents;

        	openDB();

		  };

    	reader.onerror = function(evt) {
    		console.error("File could not be read! Code " + evt.target.error.code);
		};

    reader.readAsText(f);

 	}

}

// sets up the database
function openDB()
{
  var openRequest = indexedDB.open("events", 8);

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

    if (!thisDB.objectStoreNames.contains("numCPUs"))
    {
    	thisDB.createObjectStore("numCPUs");
    	console.log("numCPUs created");
    }

    if (!thisDB.objectStoreNames.contains("AutocompleteEventTypes"))
    {
    	thisDB.createObjectStore("AutocompleteEventTypes");
    	console.log("autocompleteEventTypes created");
    }

    if (!thisDB.objectStoreNames.contains("AutocompleteNames"))
    {
    	thisDB.createObjectStore("AutocompleteNames");
    	console.log("autocompleteNames created");
    }

    if (!thisDB.objectStoreNames.contains("cycleEvents"))
    {
    	thisDB.createObjectStore("cycleEvents");
    	console.log("cycleEvents created");
    }
  }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    db = e.target.result;

    var xact = db.transaction(["Events"],"readwrite");
    var xact2 = db.transaction(["Tasks"], "readwrite");
    var xact3 = db.transaction(["numCPUs"], "readwrite");
    var xact4 = db.transaction(["AutocompleteEventTypes"], "readwrite");
    var xact5 = db.transaction(["AutocompleteNames"], "readwrite");
    var xactCycles = db.transaction(["cycleEvents"], "readwrite");
    var store = xact.objectStore("Events");
    var store2 = xact2.objectStore("Tasks");
    var store3 = xact3.objectStore("numCPUs");
    var store4 = xact4.objectStore("AutocompleteEventTypes");
    var store5 = xact5.objectStore("AutocompleteNames");
    var storeCycles = xactCycles.objectStore("cycleEvents");
    var requestCycles = storeCycles.put(JSONcycleEvents, 1);
    var request3 = store3.put(JSONnumCPUs, 1);
    var request = store.put(JSONevents, 1);
    var request4 = store4.put(JSONautocompleteEventTypes, 1);
    var request5 = store5.put(JSONautocompleteNames, 1);
    var request2 = store2.put(JSONtasks, 1);
    

    // some kind of error handling
    requestCycles.onerror = function(e) {console.log("error", e.target.error.name);}

    requestCycles.onsuccess = function(e) {console.log("cycleEvents added");}

    request.onerror = function(e) {console.log("Error", e.target.error.name);}

    request.onsuccess = function(e) {console.log("added events");}

     // some kind of error handling
   

    request3.onerror = function(e) {console.log("Error", e.target.error.name);}

    request3.onsuccess = function(e) {console.log("added numCPUs");}

    request4.onerror = function(e) {console.log("Error", e.target.error.name);}

    request4.onsuccess = function(e) {console.log("added autocompleteEventTypes");}

    request5.onerror = function(e) {console.log("Error", e.target.error.name);}

    request5.onsuccess = function(e) {console.log("added autocompleteNames");}

     request2.onerror = function(e) {console.log("Error", e.target.error.name);}

    request2.onsuccess = function(e) {console.log("added tasks"); document.location.href='main.html';}

  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
}

function handleUseOld(evt)
{
	console.log("yo");
	var openRequest = indexedDB.open("events", 8);

	openRequest.onupgradeneeded = function(e)
	{
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

	      if (!thisDB.objectStoreNames.contains("numCPUs"))
	    {
	      thisDB.createObjectStore("numCPUs");
	      console.log("created numCPUs");
	    }

		if (!thisDB.objectStoreNames.contains("AutocompleteEventTypes"))
	    {
	      thisDB.createObjectStore("AutocompleteEventTypes");
	      console.log("created autocompleteEventTypes");
	    }

	    if (!thisDB.objectStoreNames.contains("AutocompleteNames"))
	    {
	      thisDB.createObjectStore("AutocompleteNames");
	      console.log("created autocompleteNames");
	    }

	     if (!thisDB.objectStoreNames.contains("cycleEvents"))
    	{
    	thisDB.createObjectStore("cycleEvents");
    	console.log("cycleEvents created");
    	}
	}

	openRequest.onsuccess = function(e)
	{

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

	    if (!thisDB.objectStoreNames.contains("numCPUs"))
	    {
	    	thisDB.createObjectStore("numCPUs");
	    	console.log("created numCPUs");
	    }

	    if (!thisDB.objectStoreNames.contains("AutocompleteEventTypes"))
	    {
	    	thisDB.createObjectStore("AutocompleteEventTypes");
	    	console.log("created autocompleteEventTypes");
	    }

	    if (!thisDB.objectStoreNames.contains("AutocompleteNames"))
	    {
	    	thisDB.createObjectStore("AutocompleteNames");
	    	console.log("created autocompleteNames");
	    }

	    if (!thisDB.objectStoreNames.contains("cycleEvents"))
	    {
	    	thisDB.createObjectStore("cycleEvents");
	    	console.log("created cycleEvents");
	    }

		var db = e.target.result;
		var xact = db.transaction(["Events"],"readwrite");
	    var xact2 = db.transaction(["Tasks"], "readwrite");
	    var xact3 = db.transaction(["numCPUs"], "readwrite");
	    var xact4 = db.transaction(["AutocompleteEventTypes"], "readwrite");
	    var xact5 = db.transaction(["AutocompleteNames"], "readwrite");
	    var store = xact.objectStore("Events");
	    var store2 = xact2.objectStore("Tasks");
	    var store3 = xact3.objectStore("numCPUs");
	    var store4 = xact4.objectStore("AutocompleteEventTypes");
	    var store5 = xact5.objectStore("AutocompleteNames");
	    var result = store.get(1);
	    var result2 = store2.get(1);
	    var result3 = store3.get(1);
	    var result4 = store4.get(1);
	    var result5 = store5.get(1);
	    var xactCycles = db.transaction(["cycleEvents"]);
		var storeCycles = xactCycles.objectStore("cycleEvents");
		var resultCycles = storeCycles.get(1);

	    // // some kind of error handling
	    result.onerror = function(e) {console.log("Error", e.target.error.name);}

	    result.onsuccess = function(e) {
	    								 if (e.target.result == null)
	    									{
	    										console.log("events are null");
	    									}
	    								}

	    //  // some kind of error handling
	    result2.onerror = function(e) {console.log("Error", e.target.error.name);}

	    result2.onsuccess = function(e) {
	    									if (e.target.result == null)
	    									{
	    										console.log("tasks are null");
	    										window.alert(
	    											"There is no old data. Please select a file."
	    											);
	    									}
	    									else
	    									{
	    										document.location.href='main.html';
	    									}
	    								}

	    result3.onerror = function(e) {console.log("error", e.target.error.name);}

	    result3.onsuccess = function(e) {
	    									if (e.target.result == null)
	    									{
	    										console.log("tasks are null");
	    										window.alert(
	    											"There is no old data. Please select a file."
	    											);
	    									}
	    									else
	    									{
	    										document.location.href='main.html';
	    									}
	    								}

	    result4.onerror = function(e) {console.log("error", e.target.error.name);}

	    result4.onsuccess = function(e) {
	    									if (e.target.result == null)
	    									{
	    										console.log("tasks are null");
	    										window.alert(
	    											"There is no old data. Please select a file."
	    											);
	    									}
	    									else
	    									{
	    										document.location.href='main.html';
	    									}
	    								}

	    result5.onerror = function(e) {console.log("error", e.target.error.name);}

	    result5.onsuccess = function(e) {
	    									if (e.target.result == null)
	    									{
	    										console.log("tasks are null");
	    										window.alert(
	    											"There is no old data. Please select a file."
	    											);
	    									}
	    									else
	    									{
	    										document.location.href='main.html';
	    									}
	    								}
	}

	openRequest.onerror = function(e)
	{
		console.log("error in OpenRequest");
		console.dir(e);
	}
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('old').addEventListener('click', handleUseOld, false);