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

    for (var i=0; i<obj.events.length; i++)
    {
        // var tmpl = document.getElementById('list_template').content.cloneNode(true);
        // tmpl.querySelector('#name').innerText = obj.events[i].name;
        // tmpl.querySelector('#pid').innerText = obj.events[i].pid;
        // bodyDiv.appendChild(tmpl);
        var iDiv = document.createElement('div');
        iDiv.innerHTML += '<ul>' + (obj.events[i].name) + obj.events[i].startTime +
                          obj.events[i].cpu + obj.events[i].eventType + obj.events[i].extraInfo + obj.events[i].pid + '</ul>';
        document.getElementById('bodyDiv').appendChild(iDiv);
    }

    var FJS = FilterJS(obj, '#bodyDiv', {
      template: '#list_template'
    });

    };

    reader.onerror = function(evt) {
    console.error("File could not be read! Code " + evt.target.error.code);
    };

    reader.readAsText(f);

    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);