var values = [];    // the list of tasks
var maxPreemp = 0;  // the highest number of preemptions
var files;
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

        // filtering out the <idle> tasks, so that they don't show up in
        // the histogram
        for (var i=0; i<data.tasks.length; i++)
        {
            if (data.tasks[i].name !== "<idle>") {
              values.push(data.tasks[i]);

              // finding the max number of preemptions
              if (data.tasks[i].preemptionCount > maxPreemp)
              {
                maxPreemp = data.tasks[i].preemptionCount;
              }
            }
        }

        // creating a filter based on the preemption count
        var value = crossfilter(values),
          typeDimension = value.dimension(function(d) {return d.preemptionCount;}),
          nameDimension = value.dimension(function(d) {return d.pid;}),
          nameGroup = nameDimension.group().reduceSum(function(d) {return 5}),
          typeGroup = typeDimension.group().reduceCount();

        var processChart = dc.rowChart("#process-list");
        var histogram = dc.barChart("#dc-bar-chart");   // the histogram

        processChart
          .width(200)
          .height(2000)
          .dimension(nameDimension)
          .group(nameGroup)
          .renderLabel(true)
          .renderTitle(false)
          .margins({top: 0, right: 0, bottom: -1, left: 0})
          .label(function(d) {
            var process = processFromPid(d.key, values);
            return "name: " + process.name + " preemptions: " + process.preemptionCount; 
          })
          .ordering(function(d) { return -processFromPid(d.key, values).preemptionCount; });
          

        histogram
          .width(700)
          .height(500)
          .x(d3.scale.linear().domain([0,maxPreemp + 2]))
          .brushOn(true)
          .dimension(typeDimension)
          .group(typeGroup)
          .renderHorizontalGridLines(true)
          .xAxisLabel("Preemption Count")
          .yAxisLabel("Number of Processes");


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

function processFromPid(pid, values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i].pid == pid) {

      return values[i];
    }
  }

  return "";
}

