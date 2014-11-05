var files;
var eventJSON;
var currentResults=[];

//angular.js things
var resultsApp = angular.module('resultsApp', []);
resultsApp.controller('ResultsControl', function ($scope) {
  $scope.results = currentResults;
  console.log("scope.results"+$scope.results);


  $scope.getFile = function () {
    console.log("trying to get file");
    var reader = new FileReader(); 

    f = $scope.file; // FileList object
    // files is a FileList of File objects. List some properties.
    var output = [];
    console.log("scope.file:"+$scope.file);
    
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
        f.size, ' bytes, last modified: ',
        f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
       '</li>');

    reader.onload = function(evt) {
      $scope.$apply(function() {
        var contents = evt.target.result;
        //console.log("File contents: " + contents);
        var obj = JSON.parse(contents);
        console.log("First event is " + obj.events[0].name);

        eventJSON = obj.events;
        currentResults = eventJSON;
        $scope.results = eventJSON;
        console.log("scope.results"+$scope.results);


         /*for (var i = 0; i<eventJSON.length; i++)
          {
            var iDiv = document.createElement('div');
            iDiv.innerHTML += '<ul>' + eventJSON[i].name;
            document.getElementById('bodyDiv').appendChild(iDiv);
          }*/

        reader.onerror = function(evt) {
        console.error("File could not be read! Code " + evt.target.error.code);
        };
      })
    }

    reader.readAsText(f);
    console.log("scope.results"+$scope.results);
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  };
});

  function handleSwitchBox(evt) {
    if (document.getElementById('switchBox').checked)
    {
     
     console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterCheckedBoxes();
      node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }

    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_switch";});
      
      console.log("unchecked");

      node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }
    }
  }

  function handleWakeupBox(evt) {
    if (document.getElementById('wakeupBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterCheckedBoxes();
      node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }

    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_wakeup";});
      
      console.log("unchecked");

      node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }
    }
  }

  function handleRuntimeBox(evt) {
    if (document.getElementById('runtimeBox').checked)
    {
     
      console.log("checked");
      currentResults = eventJSON;
      currentResults = refilterCheckedBoxes();
      node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }

    }

    else
    {
       currentResults = _.select(currentResults, function(element){return element.eventType != "sched_stat_runtime";});
      
      console.log("unchecked");

      node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }
    }
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
        console.log("name:"+currentResults[i].name);
        console.log("length:"+currentResults.length);

        if(currentResults[i].name.indexOf(searchField) != -1) {
          tempCurrentResults.push(currentResults[i]);
        } 
      }
      currentResults = tempCurrentResults;
    }

    node = document.getElementById('bodyDiv');
      while (node.hasChildNodes())
      {
        node.removeChild(node.lastChild);
      }

      for (var i = 0; i<currentResults.length; i++)
      {
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + currentResults[i].name;
        document.getElementById('bodyDiv').appendChild(iDiv);
      }
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

  resultsApp.directive("ngFileSelect",function(){

  return {
    link: function($scope,el){
      
      el.bind("change", function(e){
      
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      })
      
    }
    
  }
})
  //document.getElementById('files').addEventListener('change', handleFileSelect, false);
  document.getElementById('switchBox').addEventListener('change', handleSwitchBox, false);
  document.getElementById('wakeupBox').addEventListener('change', handleWakeupBox, false);
  document.getElementById('runtimeBox').addEventListener('change', handleRuntimeBox, false);
  document.getElementById('searchButton').addEventListener('click', handleSearch, false);
  document.getElementById('searchBar').addEventListener('keypress', handleKeyPress, false);

