var values = [];
var maxPreemp = 0;

  d3.json("test.json", function (data) {

    for (var i=0; i<data.tasks.length; i++)
    {
        if (data.tasks[i].name !== "<idle>") {
          values.push(data.tasks[i]);
          if (data.tasks[i].preemptionCount > maxPreemp)
          {
            maxPreemp = data.tasks[i].preemptionCount;
          }
        }
    }

    var value = crossfilter(values),
    typeDimension = value.dimension(function(d) {return d.preemptionCount;}),
    typeGroup = typeDimension.group().reduceCount();


    var dataTable = dc.dataTable("#process-list");
    var histogram = dc.barChart("#dc-bar-chart");

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


    dc.renderAll();

    });

