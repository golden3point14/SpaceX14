var files;
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

    reader.onload = function(evt) {
    var contents = evt.target.result;
    //console.log("File contents: " + contents);
    var obj = JSON.parse(contents);
    console.log("First event is " + obj.events[0].name);

    var result = _.select(obj.events, function(element){return element.name == "trace-cmd";});

    for (var j = 0; j<result.length; j++)
    {
       var iDiv = document.createElement('div');
       iDiv.innerHTML += '<ul>' + result[j].name;
      document.getElementById('bodyDiv').appendChild(iDiv);
      console.log("name: " + result[j].name);
    }

    };

    reader.onerror = function(evt) {
    console.error("File could not be read! Code " + evt.target.error.code);
    };

    reader.readAsText(f);

    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);