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
          { "title" : "CPU", "width" : "40px" },
          { "title" : "Start time" },
          { "title" : "Name", "width" : "120px" },
          { "title" : "PID", "width" : "40px" },
          { "title" : "Event type", "width" : "140px" },
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

     openRequest.onerror = function(e)
     {
        console.log("Error in OpenRequest");
        console.dir(e);
     }

  openRequest.onsuccess = function(e)
  {
    console.log("openRequest success!");
    db = e.target.result;

    //get data
    var eventsRequest = db.transaction(["Events"], "readonly")
                          .objectStore("Events").get(1);

    var eventTypesRequest = db.transaction(["AutocompleteEventTypes"], "readonly")
                              .objectStore("AutocompleteEventTypes").get(1);

    var namesRequest = db.transaction(["AutocompleteNames"], "readonly")
                          .objectStore("AutocompleteNames").get(1);

    eventsRequest.onerror = function(e) {console.log("error", e.target.error);}

    eventsRequest.onsuccess = function(e) {
                                eventJSON = e.target.result;
                                currentResults = eventJSON;
                                console.log("currentResults.length:"+currentResults.length);
                                displayTable();
                                $('.loader').fadeOut("slow");
						                  }

    eventTypesRequest.onerror = function(e) {console.log("error", e.target.error);}

    eventTypesRequest.onsuccess = function(e) {
                                autocompleteEventTypes = e.target.result;
                                autoCompleteEventTypes();
                                clickSearch();
                              }

    namesRequest.onerror = function(e) {console.log("error", e.target.error);}

    namesRequest.onsuccess = function(e) {
                                autocompleteNames = e.target.result;
                                autoCompleteNames();
                                clickSearch();
                              }
  }

 
}

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    // an array that will be populated with substring matches
    var matches = [];
 
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      // Check if user query q is substring of str
      if (str.indexOf(q) != -1) {
        // Typeahead expects javascript object
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

function clickCell(cellData)
{
  window.localStorage.setItem("cellData", cellData);
  window.location.href = "process.html";
}

document.addEventListener("load", openDB());
