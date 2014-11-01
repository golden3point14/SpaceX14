var values = [];    // the list of tasks
var maxPreemp = 0;  // the highest number of preemptions
var files;
var reader = new FileReader(); 

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
          typeGroup = typeDimension.group().reduceCount();


        var dataTable = dc.dataTable("#process-list");  // the table of processes
        var histogram = dc.barChart("#dc-bar-chart");   // the histogram

        dataTable
          .width(300)
          .height(500)
          .dimension(typeDimension)
          .group(function(d) { return "List of all selected processes"})
          .columns([
            function(d) {return d.name},
            function(d) {return d.preemptionCount;}
            ])
          .sortBy(function(d) {return d.preemptionCount;})
          .order(d3.ascending)
          .renderlet(function(table) {
            table.selectAll(".dc-data-table").on("click", function (d) {
              alert("hi");
            })
          })

        // window.function(value) {
        //   alert("hi");
        // }

        histogram
          .width(500)
          .height(400)
          .x(d3.scale.linear().domain([0,maxPreemp + 1]))
          .elasticY(true)
          .elasticX(true)
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

