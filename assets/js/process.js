var files;
var eventJSON;
var taskJSON;
var reader = new FileReader();
// var autocompleteEventTypes;
var autocompleteNames;
var currentTasks;

//pulls the data from the IndexedDB and displays it
  function openDB()
  {
    var openRequest = indexedDB.open("events", 7);
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
    
    // if (!thisDB.objectStoreNames.contains("AutocompleteEventTypes"))
    // {
    //   thisDB.createObjectStore("AutocompleteEventTypes");
    //   console.log("created autocompleteEventTypes");
    // }

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
    var xact2 = db.transaction(["Tasks"], "readonly");
    var xact3 = db.transaction(["AutocompleteNames"], "readonly");
    var objectStore = xact.objectStore("Events");
    var objectStore2 = xact2.objectStore("Tasks");
    var objectStore3 = xact3.objectStore("AutocompleteNames");
    var ob = objectStore.get(1); //temporary hard-coded
    var ob2 = objectStore2.get(1);
    var ob3 = objectStore3.get(1);

    ob.onsuccess = function(e) {console.log("e is the JSONevents");
                                //console.log(e.target.result);
                                eventJSON = e.target.result;
                                // currentResults = eventJSON;
                                // console.log("currentResults.length:"+currentResults.length);
                                // displayTable();
						                  }

    ob2.onsuccess = function(e) {console.log("e is the JSONevents");
                                taskJSON = e.target.result;
                              }

    ob3.onsuccess = function(e) {console.log("e is the JSONevents");
                                //console.log(e.target.result);
                                autocompleteNames = e.target.result;
                                console.log("autocompleteNames"+autocompleteNames);
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

function autoCompleteNames() {
$('#search-process').typeahead({
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

             console.log(filterString);
             var tasks = _.filter(taskJSON, function(e){return e.name === filterString;});
             console.log(tasks);
             currentTasks = tasks;

            var data = [];
            var newData = [];
            for (var i = 0; i < currentTasks.length; i++) {
              for (var j = 0; j < currentTasks[i].preemptedBy.length; j++){
                // data.push([currentTasks[i].preemptedBy[j]]);
                if (!_.contains(data, currentTasks[i].preemptedBy[j])) {
                  newData.push([currentTasks[i].preemptedBy[j], 1]);
                  data.push(currentTasks[i].preemptedBy[j]);
                } else {
                  var process = _.find(newData, function(a) {return a[0] == currentTasks[i].preemptedBy[j];});
                  process[1]++;
                }
              }
            }

            document.getElementById('table_title').innerHTML = filterString + 
              " was preempted " + data.length + " times by:";


            if ( $.fn.dataTable.isDataTable( '#example' ) ) {
                // table = $('#example').DataTable();
                var table = $('#example').DataTable();
                table.destroy();
                table = $('#example').dataTable( {
                data: newData,
                columns: [
                    { "title": "Process Name" },
                    { "title": "Number of Preemptions" }
                ],
                deferRender:    true,
                dom:            "frtiS",
                scrollY:        450,
                scrollCollapse: true
              } ); 
            }
            else {
                var table = $('#example').dataTable( {
                data: newData,
                columns: [
                    { "title": "Process Name" },
                    { "title": "Number of Preemptions" }
                ],
                deferRender:    true,
                dom:            "frtiS",
                scrollY:        450,
                scrollCollapse: true
              } ); 
            }                
      });
}


document.addEventListener("load", openDB());