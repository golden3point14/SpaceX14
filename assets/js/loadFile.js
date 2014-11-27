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
	var openRequest = indexedDB.open("events", 2);

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

		var db = e.target.result;
		var xact = db.transaction(["Events"],"readwrite");
	    var xact2 = db.transaction(["Tasks"], "readwrite");
	    var store = xact.objectStore("Events");
	    var store2 = xact2.objectStore("Tasks");
	    var result = store.get(1);
	    var result2 = store2.get(1);

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
	}

	openRequest.onerror = function(e)
	{
		console.log("error in OpenRequest");
		console.dir(e);
	}
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('old').addEventListener('click', handleUseOld, false);