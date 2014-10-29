var values = [];    // the list of tasks
var maxPreemp = 0;  // the highest number of preemptions

  d3.json("test.json", function (data) { // getting the data from example.json

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
      .size(10000)
        .columns([
          function(d) {return d.name},
          function(d) {return d.preemptionCount;}
          ])
        .sortBy(function(d) {return d.preemptionCount;})
        .order(d3.ascending);

    histogram
      .width(500)
      .height(400)
      .x(d3.scale.linear().domain([0,maxPreemp + 1]))
      .brushOn(true)
      .dimension(typeDimension)
      .group(typeGroup);

    // render the content
    dc.renderAll();

    });

