var files;
var eventJSON;
var currentResults;
var reader = new FileReader();
function handleFileSelect(evt) {
  files = evt.target.files; // FileList object
  // files is a FileList of File objects. List some properties.
  var output = [];

  for (var i = 0, f; f = files[i]; i++) {
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
    f.size, ' bytes, last modified: ',
    f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
    '</li>');

    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

    read_file(files[0], bodyDiv);
    console.log("handFileSelect");
  }

  function read_file(f, iDiv) {
    console.log("read_file");
    reader.onload = function(evt) {
    var contents = evt.target.result;
    //console.log("File contents: " + contents);
    var obj = JSON.parse(contents);
    console.log("First event is " + obj.events[0].name);
    eventJSON = obj.events;
    currentResults = eventJSON;

    updateDisplay();
  };
  reader.onerror = function(evt) {
  console.error("File could not be read! Code " + evt.target.error.code);
  };
  reader.readAsText(f);
  }
}

function updateDisplay() {
  node = document.getElementById('bodyDiv');
  while (node.hasChildNodes())
  {
    node.removeChild(node.lastChild);
  }

  bodyDiv.innerHTML += '<td>CPU</td>'+'<td>Start Time</td>'+'<td>Name</td>'+'<td>PID</td>'+'<td>Event Type</td>'+'<td>Extra Info</td>';
  for (var i = 0; i<50; i++) {
    iDiv = document.createElement('tr');
    iDiv.innerHTML += '<td>' + currentResults[i].cpu + '</td><td>' + currentResults[i].startTime + '</td><td>' + currentResults[i].name + 
                        '</td><td>' + currentResults[i].pid + '</td><td>' + currentResults[i].eventType + '</td><td>' + currentResults[i].extraInfo + '</td>';
    document.getElementById('bodyDiv').appendChild(iDiv);
    console.log("before scrolling in some filtering function1");
  }

  var d = 50;
  var j = 2 * d;

  console.log("resutlsLength:"+currentResults.length);
  
  console.log("before scrolling in some filtering function2");

  $(window).scroll(function() {
    if($(window).scrollTop() == $(document).height() - $(window).height()) {
      console.log("scrolling");
      // load your content
      for (var i = d; i < j; i++) {
        iDiv = document.createElement('tr');
        iDiv.innerHTML += '<td>' + currentResults[i].cpu + '</td><td>' + currentResults[i].startTime + '</td><td>' + currentResults[i].name + 
                            '</td><td>' + currentResults[i].pid + '</td><td>' + currentResults[i].eventType + '</td><td>' + currentResults[i].extraInfo + '</td>';
        document.getElementById('bodyDiv').appendChild(iDiv);
      }
      d += 50;
      j = d + 50;
    }
  });
}

  function handleSwitchBox(evt) {
    if (document.getElementById('switchBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
      currentResults = refilterCheckedBoxes();

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
    currentResults = refilterCheckedBoxes();

    updateDisplay();
  }

  function handleSearch(evt) {
    console.log("handleSearch");
    searchField = document.getElementById('searchBar').value;
    
    if(searchField == "") {
      currentResults = eventJSON;
      currentResults = refilterCheckedBoxes();
    }

    else {
      var tempCurrentResults = new Array();
      currentResults = eventJSON;
      currentResults = refilterCheckedBoxes();
      for(var i=0; i<currentResults.length; i++) {
        if(currentResults[i].name.indexOf(searchField) != -1) {
          tempCurrentResults.push(currentResults[i]);
        } 
      }
      currentResults = tempCurrentResults;

      for(var i=0; i<currentResults.length; i++) {
        console.log("search name:"+i+currentResults[i].name);
      }
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


  //called when a box is unchecked
  //checks for checked boxes and filters when applicable
  function refilterCheckedBoxes()
  {
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
      return currentResults;
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
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
