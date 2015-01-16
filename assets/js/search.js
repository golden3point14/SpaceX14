var files;
var d,j;
var eventJSON;
var currentResults;
var reader = new FileReader();
var autocompleteEventTypes;
var autocompleteNames;

$('#searchButton').css('background-color', '#315B7E');

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
    		order:          [[1, 'asc']],
        columns: [
          { "title" : "CPU" },
          { "title" : "Start time" },
          { "title" : "Name" },
          { "title" : "PID" },
          { "title" : "Event type" },
          { "title" : "Extra info" }
          ]
        } );

      $('#table_id tbody').on( 'click', 'tr', function () {
        var cellData = oTable.fnGetData(this);
        // console.log( 'Clicked on: '+ cellData[2]);
        clickCell(cellData[2]);
      } );
      
  //     $('input.column_filter').on( 'keyup click', function () {
  //     filterColumn( $(this).parents('tr').attr('data-column') );
  // });
  	} );
  }

  //pulls the data from the IndexedDB and displays it
  function openDB()
  {
    var openRequest = indexedDB.open("events", 8);
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
  }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    db = e.target.result;

    //get data
    var xact = db.transaction(["Events"], "readonly");
    var xact2 = db.transaction(["AutocompleteEventTypes"], "readonly");
    var xact3 = db.transaction(["AutocompleteNames"], "readonly");
    var objectStore = xact.objectStore("Events");
    var objectStore2 = xact2.objectStore("AutocompleteEventTypes");
    var objectStore3 = xact3.objectStore("AutocompleteNames");
    var ob = objectStore.get(1); //temporary hard-coded
    var ob2 = objectStore2.get(1);
    var ob3 = objectStore3.get(1);

    ob.onsuccess = function(e) {console.log("e is the JSONevents");
                                //console.log(e.target.result);
                                eventJSON = e.target.result;
                                currentResults = eventJSON;
                                console.log("currentResults.length:"+currentResults.length);
                                displayTable();
						                  }

    ob2.onsuccess = function(e) {console.log("e is the JSONevents");
                                //console.log(e.target.result);
                                autocompleteEventTypes = e.target.result;
                                // console.log("autocompleteEventTypes"+autocompleteEventTypes);
                                autoCompleteEventTypes();
                                clickSearch();
                                // var columnFilters = document.getElementById("columnFilters");
                                // var table_id_wrapper = document.getElementById("table_id_wrapper");
                                //document.getElementById("table_id_wrapper").appendChild(columnFilters);
                                // table_id_wrapper.insertBefore(columnFilters, table_id_wrapper.firstChild);
                              }

    ob3.onsuccess = function(e) {console.log("e is the JSONevents");
                                //console.log(e.target.result);
                                autocompleteNames = e.target.result;
                                // console.log("autocompleteNames"+autocompleteNames);
                                autoCompleteNames();
                                clickSearch();
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
 
function autoCompleteEventTypes() {
$('input').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'autocompleteEventTypes',
  displayKey: 'value',
  source: substringMatcher(autocompleteEventTypes)
});
}

function autoCompleteNames() {
$('#process_filter').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'autocompleteNames',
  displayKey: 'value',
  source: substringMatcher(autocompleteNames)
});
}

function clickSearch() {
  $('.tt-dropdown-menu').click(function() {
             var filterString = $('.tt-input').val();
             $('#table_id').dataTable().fnFilter(filterString);
      });
}

// function filterColumn ( i ) {
//     $('#table_id').dataTable().column( i ).search(
//         $('#col'+i+'_filter').val()
//     ).draw();
// }

function clickCell(cellData)
{
  window.localStorage.setItem("cellData", cellData);
  window.location.href = "process.html";
}

document.addEventListener("load", openDB());
