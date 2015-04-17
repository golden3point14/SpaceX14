var gui = require('nw.gui');
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

function handleFileSelect(evt) {
    document.getElementsByClassName("loader")[0].style.display = "block";

    // Reset saved state of graphs on all pages
    var ganttPages = ["compare", "main", "process", "cycles"];
    for (var i = 0; i < ganttPages.length; i++) {
      window.localStorage.setItem(ganttPages[i] + "CurrScale", 1);
      window.localStorage.setItem(ganttPages[i] + "CurrTranslateX", "");
      window.localStorage.setItem(ganttPages[i] + "CurrTranslateY", "");
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
        extractJSON(evt.target.result);
		  };

    	reader.onerror = function(evt) {
    		console.error("File could not be read! Code " + evt.target.error.code);
		};

    reader.readAsText(f);
 	}

}

function extractJSON(contents) {
  var obj = JSON.parse(contents);
  var JSONObj = obj;
  JSONtasks = obj.tasks;
  JSONevents = obj.events;
  JSONnumCPUs = obj.numCPU;
  JSONautocompleteEventTypes = obj.autocompleteEventTypes;
  JSONautocompleteNames = obj.autocompleteNames;
  JSONcycleEvents = obj.cycleEvents;

  openDB();
}

// sets up the database
function openDB()
{
  var openRequest = indexedDB.open("events", 8);


  openRequest.onerror = function(e)
  {
    console.error("Error in OpenRequest");
    console.dir(e);
  }

  openRequest.onupgradeneeded =  function(e)
  {

    var thisDB = e.target.result;

    checkStoresExist(thisDB);
  }

  openRequest.onsuccess = function(e)
  {
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
    cyclesRequest.onerror = function(e) {console.error("error", e.target.error.name);}

    cyclesRequest.onsuccess = function(e) {

    	eventsRequest.onerror = function(f) {console.error("Error", f.target.error.name);}

    	eventsRequest.onsuccess = function(f) {

    		numCPUsRequest.onerror = function(e) {console.error("Error", e.target.error.name);}

    		numCPUsRequest.onsuccess = function(e) {
    			
    			eventTypesRequest.onerror = function(e) {console.error("Error", e.target.error.name);}

    			eventTypesRequest.onsuccess = function(e) {
    				
    				namesRequest.onerror = function(e) {console.error("Error", e.target.error.name);}

    				namesRequest.onsuccess = function(e) {

    					tasksRequest.onerror = function(e) {console.error("Error", e.target.error.name);}

    					tasksRequest.onsuccess = function(e) {
                window.localStorage.clear();
                window.localStorage.setItem("hasEverExisted", 1);
                window.localStorage.setItem("cellData", "");
                window.localStorage.setItem("compareData", JSON.stringify([]));
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
  document.getElementsByClassName("loader")[0].style.display = "block";
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

	    	
	    	eventsRequest.onerror = function(f) {console.log("Error", f.target.error.name);}

	    	eventsRequest.onsuccess = function(f) {

	    		numCPUsRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    		numCPUsRequest.onsuccess = function(e) {
	    			
	    			eventTypesRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    			eventTypesRequest.onsuccess = function(e) {
	    				
	    				namesRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    				namesRequest.onsuccess = function(e) {

	    					tasksRequest.onerror = function(e) {console.log("Error", e.target.error.name);}

	    					tasksRequest.onsuccess = function(e) {
	    						// Check that tasks aren't null, e.g. that a previous file was loaded
	    						if (e.target.result) {
                    window.localStorage.setItem("hasEverExisted", 1);
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

function checkStoresExist(thisDB) {
  var stores = ["Events", "Tasks", "numCPUs", "AutocompleteEventTypes", "AutocompleteNames", "cycleEvents"];

  for (var i = 0; i < stores.length; i++) {
    if (!thisDB.objectStoreNames.contains(stores[i]))
        {
          thisDB.createObjectStore(stores[i]);
       }
  }
}

// Have to hide input of file type in node-webkit, so there is indirection between
// clicking a button and causing a click on the hidden file dialogue
function openDialogue(evt) {
  var chooser = document.querySelector('#files');
  chooser.click();
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('old').addEventListener('click', handleUseOld, false);
document.getElementById('file').addEventListener('click', openDialogue, false);

if (gui.App.argv[0]) {
  fileURL = gui.App.argv[0] + ".json";

  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", fileURL, false);

  rawFile.onreadystatechange = function ()
  {
    // ready state of 4 indicates the operation is complete
    if (rawFile.readyState === 4)
    {
      // status of 200 indicates successful request
      if (rawFile.status === 200 || rawFile.status == 0)
      {
        if (rawFile.responseText) {
          document.getElementsByClassName("loader")[0].style.display = "block";
          extractJSON(rawFile.responseText);
        } else {
          console.log("Unable to open file: " + fileURL);
        }
      }
    }
  }

  rawFile.send();
}

// Hide the "Use last data" button if this is the first time the app is opened
var hasEverExisted = window.localStorage.getItem("hasEverExisted");
if (!hasEverExisted) {
  document.getElementById('old').style.display = "none";
}
