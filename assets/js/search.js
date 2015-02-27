var files;
var d,j;
var eventJSON;
var currentResults;
var reader = new FileReader();
var autocompleteEventTypes;
var autocompleteNames;
var isSearch = true;
var tableRows;

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
    		scrollY:        400,
    		scrollCollapse: true,
        stateSave:      true,
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

function scrollToTime(time)
{
  console.log("scrolling to " + time);
  var table = $('#table_id').DataTable();

  if(table) {
    if ((table.order()[0][0] != 1) || (table.order()[0[1] != 'asc'])) {
      table.order([[1,'asc']]);
      table.draw();
    }
    var rows = table.rows()[0];
    var index = findIndex(rows, time);
    console.log("index="+index);
    var oSettings = $('#table_id').dataTable().fnSettings();
    // oSettings.oScroller.fnScrollToRow(index, false);
    oSettings.oScroller.fnScrollToRow(index, true);
  }
}

function findIndex(values, target) {
  return binarySearch(values, target, 0, values.length - 1);
};

function binarySearch(values, target, start, end) {
  // console.log("start="+start+", end="+end);
  var table = $('#table_id').DataTable();
  var startTime = table.cell(start, 1).data();
  var endTime = table.cell(end, 1).data()
  if (startTime > endTime) { return -1; } //does not exist

  var middle = Math.floor((start + end) / 2);
  var value = table.cell(values[middle], 1).data()

  if (value > target) { return binarySearch(values, target, start, middle-1); }
  if (value < target) { return binarySearch(values, target, middle+1, end); }
  return middle; //found!
}

document.addEventListener("load", openDB());
