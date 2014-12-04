var values = [];    // the list of tasks
var reader = new FileReader(); 
var doc = document;

var db; //for indexedDB
var JSONtasks;

document.addEventListener("DOMContentLoaded", openDB());

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

    //get data
    var xact = db.transaction(["Tasks"], "readonly");
    var objectStore = xact.objectStore("Tasks");
    var ob = objectStore.get(1); //temporary hard-coded
    ob.onsuccess = function(e) { console.log("e is the JSONtasks");
                                 console.log(e.target.result);
                                 JSONtasks = e.target.result;
                                 useDatabaseData();
                               }
    
  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
}


function useDatabaseData() {
  for (var i=0; i<JSONtasks.length; i++)
  {
      if (JSONtasks[i].name !== "<idle>") {
        values.push(JSONtasks[i]);
      }
  }

  console.log("making timeline");

  var labelTestData = [
    {label: "cpu a", times: [{"starting_time": 1355752800000, "ending_time": 1355759900000}, {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {label: "cpu b", times: [{"starting_time": 1355759910000, "ending_time": 1355761900000}, ]},
    {label: "cpu c", times: [{"starting_time": 1355761910000, "ending_time": 1355763910000}]},
  ];

  var width= 1000;
  var chart = d3.timeline()
    .width(width)
    .stack()
    .margin({left:70, right:30, top:0, bottom:0})
    .hover(function (d, i, datum) {
    // d is the current rendering object
    // i is the index during d3 rendering
    // datum is the id object
      var div = $('#hoverRes');
      var colors = chart.colors();
      div.find('.coloredDiv').css('background-color', colors(i))
      div.find('#name').text(datum.label);
    })
    .scroll(function (x, scale) {
      $("#scrolled_date").text(scale.invert(x) + " to " + scale.invert(x+width));
    });

  var svg = d3.select("#timeline3").append("svg").attr("width", width)
    .datum(labelTestData).call(chart);
}
