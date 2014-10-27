
var values = [0,0,0,1,2,2,3,3,4,4,4,4,5,5,6,1,8,0,0,0,0,0,0,0,0,0,1];

var value = crossfilter(values),
  typeDimension = value.dimension(function(d) {return d;}),
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
      function(d) {return "process name"},
      function(d) {return d;}
      ])
    .sortBy(function(d) {return d;})
    .order(d3.ascending);

histogram
  .width(500)
  .height(400)
  .x(d3.scale.linear().domain([0,10]))
  .brushOn(true)
  .dimension(typeDimension)
  .group(typeGroup);


dc.renderAll();

