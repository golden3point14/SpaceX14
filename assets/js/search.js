var files;
var d,j;
var eventJSON;
var currentResults;
var reader = new FileReader();
var tableOffset = $("#table").offset().top;
var $header = $("#table > thead").clone();
var $fixedHeader = $("#header-fixed").append($header);

function updateDisplay() {
  node = document.getElementById('bodyDiv');
  while (node.hasChildNodes())
  {
    node.removeChild(node.lastChild);
  }

  console.log("currenResultsLength:"+currentResults.length);
  if(currentResults.length < 50) {
    for (var i = 0; i<currentResults.length; i++) {
      iDiv = document.createElement('tr');
      iDiv.innerHTML += '<td>' + currentResults[i].cpu + '</td><td>' + currentResults[i].startTime + '</td><td>' + currentResults[i].name + 
                          '</td><td>' + currentResults[i].pid + '</td><td>' + currentResults[i].eventType + '</td><td>' + currentResults[i].extraInfo + '</td><td>' + i + '</td>';
      document.getElementById('bodyDiv').appendChild(iDiv);
    }
    console.log("currentResults.length < 50 loop:"+currentResults.length);
  } else {
    for (var i = 0; i<50; i++) {
      iDiv = document.createElement('tr');
      iDiv.innerHTML += '<td>' + currentResults[i].cpu + '</td><td>' + currentResults[i].startTime + '</td><td>' + currentResults[i].name + 
                          '</td><td>' + currentResults[i].pid + '</td><td>' + currentResults[i].eventType + '</td><td>' + currentResults[i].extraInfo + '</td><td>' + i + '</td>';
      document.getElementById('bodyDiv').appendChild(iDiv);
    }
    console.log("currentResults.length else case loop:"+currentResults.length);
  }

  d = 50;
  j = 2 * d;

  console.log("d:"+d);
  console.log("j:"+j);

  $(window).bind("scroll", function() {
      var offset = $(this).scrollTop();
      
      if (offset >= tableOffset && $fixedHeader.is(":hidden")) {
          $fixedHeader.show();
      }
      else if (offset < tableOffset) {
          $fixedHeader.hide();
      }
  });

  $(window).scroll(function() {
    if($(window).scrollTop() == $(document).height() - $(window).height()) {
      console.log("d in start of scroll:"+d);
      console.log("j in start of scroll:"+j);
      if(currentResults.length < 50) {
        console.log('currentResults less than 50:'+currentResults.length);
        $(window).unbind('scroll');
      }
      //continue loading in blocks of 50
      else if(j < currentResults.length) {
        console.log('currentResults loading in blocks of 50:'+currentResults.length);
        // load your content
        for (var i = d; i < j; i++) {
          iDiv = document.createElement('tr');
          iDiv.innerHTML += '<td>' + currentResults[i].cpu + '</td><td>' + currentResults[i].startTime + '</td><td>' + currentResults[i].name + 
                              '</td><td>' + currentResults[i].pid + '</td><td>' + currentResults[i].eventType + '</td><td>' + currentResults[i].extraInfo + '</td><td>' + i + '</td>';
          document.getElementById('bodyDiv').appendChild(iDiv);
        }
        d += 50;
        j = d + 50;

        console.log("d inside scroll:" + d);
        console.log("j inside scroll:" + j);
      }
      //last batch has less than 50
      else {
        //calculate difference somehow?
        var lengthLeft = currentResults.length%50;
        console.log('currentResults in last batch less than 50:'+currentResults.length);
        console.log("d inside last batch less than 50:"+d);
        for (var i = currentResults.length-lengthLeft; i < currentResults.length; i++) {
          iDiv = document.createElement('tr');
          iDiv.innerHTML += '<td>' + currentResults[i].cpu + '</td><td>' + currentResults[i].startTime + '</td><td>' + currentResults[i].name + 
                              '</td><td>' + currentResults[i].pid + '</td><td>' + currentResults[i].eventType + '</td><td>' + currentResults[i].extraInfo + '</td><td>' + i + '</td>';
          document.getElementById('bodyDiv').appendChild(iDiv);
        }
        $(window).unbind('scroll');
      }
    }
  });
}

  function handleSwitchBox(evt) {
    if (document.getElementById('switchBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();

    }

    else
    { 
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_switch";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleWakeupBox(evt) {
    if (document.getElementById('wakeupBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();

    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_wakeup";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleRuntimeBox(evt) {
    if (document.getElementById('runtimeBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_runtime";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleMigrateBox(evt) {
    if (document.getElementById('migrateBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_migrate_task";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleSleepBox(evt) {
    if (document.getElementById('sleepBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_sleep";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleWaitBox(evt) {
    if (document.getElementById('waitBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_wait";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleEntryBox(evt) {
    if (document.getElementById('entryBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "softirq_entry";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleRaiseBox(evt) {
    if (document.getElementById('raiseBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "softirq_raise";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function handleExitBox(evt) {
    if (document.getElementById('exitBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();

      updateDisplay();
    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "softirq_exit";});
      
      console.log("unchecked");

      updateDisplay();
    }
  }

  function checkall(eventFilters,eventFilter,thestate){
    var el_collection=eval("document.forms."+eventFilters+"."+eventFilter)
    for (c=0;c<el_collection.length;c++) {
      el_collection[c].checked=thestate;
    }
    console.log("checked");
    currentResults = eventJSON;
    currentResults = refilterSearchBarAndCheckedBoxes();

    updateDisplay();
  }

  function handleSearch(evt) {
    console.log("handleSearch");
    searchField = document.getElementById('searchBar').value;
    
    if(searchField == "") {
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();
    }

    else {
      var tempCurrentResults = new Array();
      currentResults = eventJSON;
      currentResults = refilterSearchBarAndCheckedBoxes();
      for(var i=0; i<currentResults.length; i++) {
        if(currentResults[i].name.indexOf(searchField) != -1) {
          tempCurrentResults.push(currentResults[i]);
        } 
      }
      currentResults = tempCurrentResults;
    }

    updateDisplay();
  }

  function handleKeyPress(evt) {
    var keycode=evt.keyCode;

    if(keycode==13) {
      handleSearch(evt);
    }
    return false;
  }

  function predicatBy(prop){
    return function(a,b){
      if( a[prop] > b[prop]){
        return 1;
      } else if( a[prop] < b[prop] ){
          return -1;
      } 
      return -1
    }
  }

  function sortEvents(json) {
    json.sort(predicatBy("cpu"));
    updateDisplay();
  }

  //called when a box is unchecked
  //checks for checked boxes and filters when applicable
  function refilterSearchBarAndCheckedBoxes()
  {
    searchField = document.getElementById('searchBar').value;

    if (searchField != "")
    {
      currentResults = _.select(currentResults, function(element){return element.name.indexOf(searchField) != -1;});
    }
    if (!document.getElementById('switchBox').checked)
    {
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_switch";});
    }
    if (!document.getElementById('wakeupBox').checked)
    {
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_wakeup";});
    }
    if (!document.getElementById('runtimeBox').checked)
    {
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_runtime";});
    }
    if (!document.getElementById('migrateBox').checked)
    {
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_migrate_task";});
    }
    if (!document.getElementById('sleepBox').checked)
    {
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_sleep";});
    }
    if (!document.getElementById('waitBox').checked)
    {
      currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_wait";});
    }
    return currentResults;
  }

  /*function refilterSearchBar()
  {
    console.log('start refilterSearchBar');
    if (document.getElementById('searchBar').value != "")
    {
      currentResults = _.select(currentResults, function(element){return element.name == searchField;});
      console.log("in refilterSearchBar:");
    }
    console.log("refilterSearchBar:"+currentResults.length);
    return currentResults;
  }*/

  //pulls the data from the IndexedDB and displays it
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
    var xact = db.transaction(["Events"], "readonly");
    var objectStore = xact.objectStore("Events");
    var ob = objectStore.get(1); //temporary hard-coded
    ob.onsuccess = function(e) { console.log("e is the JSONevents");
                                 console.log(e.target.result);
                                 eventJSON = e.target.result;
                                 currentResults = eventJSON;
                                 updateDisplay();
                               }
    
  }

  openRequest.onerror = function(e)
  {
    console.log("Error in OpenRequest");
    console.dir(e);
  }
}

  document.getElementById('switchBox').addEventListener('change', handleSwitchBox, false);
  document.getElementById('wakeupBox').addEventListener('change', handleWakeupBox, false);
  document.getElementById('runtimeBox').addEventListener('change', handleRuntimeBox, false);
  document.getElementById('migrateBox').addEventListener('change', handleMigrateBox, false);
  document.getElementById('sleepBox').addEventListener('change', handleSleepBox, false);
  document.getElementById('waitBox').addEventListener('change', handleWaitBox, false);
  document.getElementById('entryBox').addEventListener('change', handleEntryBox, false);
  document.getElementById('raiseBox').addEventListener('change', handleRaiseBox, false);
  document.getElementById('exitBox').addEventListener('change', handleExitBox, false);
  document.getElementById('searchButton').addEventListener('click', handleSearch, false);
  document.getElementById('searchBar').addEventListener('keypress', handleKeyPress, false);
  document.addEventListener("load", openDB());
