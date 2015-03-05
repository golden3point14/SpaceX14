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

// window.localStorage.setItem("cellData", "");
// window.localStorage.setItem("compareData", JSON.stringify([]));

function handleFileSelect(evt) {
    window.localStorage.setItem("cellData", "");
    window.localStorage.setItem("compareData", JSON.stringify([]));

    // Reset saved state of graphs on all pages
    var ganttPages = ["compare", "main", "process", "cycles"];
    for (var i = 0; i < ganttPages.length; i++) {
      window.localStorage.setItem(ganttPages[i] + "CurrScale", 1);
      window.localStorage.setItem(ganttPages[i] + "CurrXTranslate", "");
      window.localStorage.setItem(ganttPages[i] + "CurrYTranslate", "");
    }

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


  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }

  openRequest.onupgradeneeded =  function(e)
  {
    console.log("upgrading...");

    var thisDB = e.target.result;

    checkStoresExist(thisDB);
  }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    db = e.target.result;

    var cyclesRequest = db.transaction(["cycleEvents"], "readwrite")
    					.objectStore("cycleEvents").put(JSONcycleEvents,1);

    var eventsRequest = db.transaction(["Events"],"readwrite")
    					.objectStore("Events").put(JSONevents,1);
   
    var numCPUsRequest = db.transaction(["numCPUs"], "readwrite")
    					.objectStore("numCPUs").put(JSONnumCPUs,1);

    var eventTypesRequest = db.transaction(["AutocompleteEventTypes"], "readwrite")
    					.objectStore("AutocompleteEventTypes")
    					.put(JSONautocompleteEventTypes,1);

    var namesRequest = db.transaction(["AutocompleteNames"], "readwrite")
    					.objectStore("AutocompleteNames").put(JSONautocompleteNames,1);
    
    var tasksRequest = db.transaction(["Tasks"], "readwrite")
    					.objectStore("Tasks").put(JSONtasks,1);
      

    // some kind of error handling
    cyclesRequest.onerror = function(e) {console.log("error", e.target.error.name);}

    cyclesRequest.onsuccess = function(e) {

    	console.log("cycleEvents added");
    	
    	eventsRequest.onerror = function(f) {console.log("Error", f.target.error.name);}

    	eventsRequest.onsuccess = function(f) {
    		console.log("added events");

    		numCPUsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

    		numCPUsRequest.onsuccess = function(e) {
    			console.log("added numCPUs");
    			
    			eventTypesRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

    			eventTypesRequest.onsuccess = function(e) {
    				console.log("added autocompleteEventTypes");
    				
    				namesRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

    				namesRequest.onsuccess = function(e) {
    					console.log("added autocompleteNames");

    					tasksRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

    					tasksRequest.onsuccess = function(e) {
    						console.log("added tasks");
    						document.location.href='main.html';
    					}
    				}
    			}
    		}    		
    	}
    }

  }
}

function handleUseOld(evt)
{
	var openRequest = indexedDB.open("events", 8);

	openRequest.onerror = function(e)
	{
		console.log("error in OpenRequest");
		console.dir(e);
	}

	openRequest.onupgradeneeded = function(e)
	{
		var thisDB = e.target.result;

		checkStoresExist(thisDB);
	}

	openRequest.onsuccess = function(e)
	{
		var db = e.target.result;

		var cyclesRequest = db.transaction(["cycleEvents"], "readonly")
	    					.objectStore("cycleEvents").get(1);

	    var eventsRequest = db.transaction(["Events"],"readonly")
	    					.objectStore("Events").get(1);

	    var numCPUsRequest = db.transaction(["numCPUs"], "readonly")
	    					.objectStore("numCPUs").get(1);

	    var eventTypesRequest = db.transaction(["AutocompleteEventTypes"], "readonly")
	    					.objectStore("AutocompleteEventTypes").get(1);

	    var namesRequest = db.transaction(["AutocompleteNames"], "readonly")
	    					.objectStore("AutocompleteNames").get(1);
	    
	    var tasksRequest = db.transaction(["Tasks"], "readonly")
	    					.objectStore("Tasks").get(1);
	      
	    // some kind of error handling
	    cyclesRequest.onerror = function(e) {console.log("error", e.target.error.name);}

	    cyclesRequest.onsuccess = function(e) {

	    	console.log("cycleEvents added");
	    	
	    	eventsRequest.onerror = function(f) {console.log("Error", f.target.error.name);}

	    	eventsRequest.onsuccess = function(f) {
	    		console.log("added events");

	    		numCPUsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    		numCPUsRequest.onsuccess = function(e) {
	    			console.log("added numCPUs");
	    			
	    			eventTypesRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    			eventTypesRequest.onsuccess = function(e) {
	    				console.log("added autocompleteEventTypes");
	    				
	    				namesRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    				namesRequest.onsuccess = function(e) {
	    					console.log("added autocompleteNames");

	    					tasksRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    					tasksRequest.onsuccess = function(e) {
	    						console.log("added tasks");
	    						// Check that tasks aren't null, e.g. that a previous file was loaded
	    						if (e.target.result) {
	    							document.location.href='main.html';
	    						} else {
	    							window.alert("No old data.");
	    						}
	    						
	    					}
	    				}
	    			}
	    		}    		
	    	}
	    }
	}
}

// NOT TESTED??? 
function checkStoresExist(thisDB) {
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

document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('old').addEventListener('click', handleUseOld, false);