var files;
var d,j;
var eventJSON;
var currentResults;
var reader = new FileReader();

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
    ob.onsuccess = function(e) { console.log("e is the JSONevents");
                                 //console.log(e.target.result);
                                 eventJSON = e.target.result;
                                 currentResults = eventJSON;
                                 console.log("currentResults.length:"+currentResults.length);

                                 $(document).ready(function() {
        var data = [];
        for ( var i=0 ; i<currentResults.length ; i++ ) {
            data.push( [ currentResults[i].cpu, currentResults[i].startTime, currentResults[i].name, currentResults[i].pid, currentResults[i].eventType, currentResults[i].extraInfo ] );
        }
         
        var oTable = $('#table_id').dataTable( {
            data:           data,
            deferRender:    true,
            dom:            "frtiS",
            scrollY:        450,
            scrollCollapse: true
        } );
    } );
                               }
    
  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
}

document.addEventListener("load", openDB());
