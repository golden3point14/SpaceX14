var values = [];    // the list of tasks
var maxSleeptime = 0.0;  // the longest runtime
var minSleeptime = Infinity;  // the shortest runtime
var reader = new FileReader(); 
var doc = document;

  // d3.json("test.json", function (data) { // getting the data from test.json
  function handleFileSelect(evt) {
    files = evt.target.files; // FileList object

    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');

      reader.onload = function(evt) {
        var contents = evt.target.result;
        var data = JSON.parse(contents);

        console.log(data.tasks);

        // filtering out the <idle> tasks, so that they don't show up in
        // the histogram
        for (var i=0; i<data.tasks.length; i++)
        {
            if (data.tasks[i].name !== "<idle>") {
              values.push(data.tasks[i]);

              // finding the max number of preemptions
              if (data.tasks[i].totalSleeptime > maxSleeptime)
              {
                maxSleeptime = data.tasks[i].totalSleeptime;
              }

              if (data.tasks[i].totalSleeptime < minSleeptime)
              {
                minSleeptime = data.tasks[i].totalSleeptime;
              }
            }
        }

        // creating a filter based on the preemption count
        var value = crossfilter(values),
          typeDimension = value.dimension(function(d) {return d.totalSleeptime;}),
          typeGroup = typeDimension.group().reduceCount();

        var dataTable = dc.dataTable("#process-list");  // the table of processes
        var histogram = dc.rowChart("#dc-bar-chart");   // the histogram

        dataTable
          .width(300)
          .height(500)
          .dimension(typeDimension)
          .group(function(d) { return "List of all selected processes"})
          .columns([
            function(d) {return d.name;},
            function(d) {return d.totalSleeptime;}
            ])
          .sortBy(function(d) {return d.totalSleeptime;})
          .order(d3.ascending);

        histogram
          .width(700)
          .height(500)
          .dimension(typeDimension)
          .group(typeGroup)
          .label(function(d) {return d.name})
          .renderLabel(true);

        // render the content
        dc.renderAll();

    };

    reader.onerror = function(evt) {
      console.error("File could not be read! Code " + evt.target.error.code);
    };

    reader.readAsText(f);

  }

  document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
