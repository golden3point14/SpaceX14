// Basic histogram code from http://bl.ocks.org/mbostock/3048450

var db; //indexedDB stuff

// Generate a Bates distribution of 10 random variables.
// var values = d3.range(1000).map(d3.random.bates(10));
var values = [0.5,0.5,0.5,0.4,0.6];

// A formatter for counts.
var formatCount = d3.format(",.0f");

var margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([0, 1])
    .range([0, width]);

var numTicks = 50;
var stepSize = 1.0/numTicks;

// Generate a histogram using twenty uniformly-spaced bins.
var data = d3.layout.histogram()
    .bins(x.ticks(numTicks))
    (values);

var list = d3.selectAll(".list")
    .data([processList]);

var dataTable = dc.dataTable("#dc-table-graph");

var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var brush = d3.svg.brush()
    .x(x)
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend);

var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var bar = svg.selectAll(".bar")
    .data(data)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

bar.append("rect")
    .attr("x", 1)
    .attr("width", x(data[0].dx) - 1)
    .attr("height", function(d) { return height - y(d.y); });

bar.append("text")
    .attr("dy", "-.75em")
    .attr("y", 6)
    .attr("x", x(data[0].dx) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { 
        if (formatCount(d.y) != 0)
        {
          return formatCount(d.y); 
        } else {
          return "";
        }
      });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "x brush")
    .call(brush)
  .selectAll("rect")
    .attr("y", -19)
    .attr("height", height + 20);


renderAll();

// Renders the specified chart or list.
function render(method) {
  d3.select(this).call(method);
}

// Whenever the brush moves, re-rendering everything.
function renderAll() {
  list.each(render);
}

function brushstart() {
  // do nothing
}

function brushmove() {
  var e = brush.extent();
  svg.selectAll("rect").classed("hidden", function(d) {
    return e[0] > d.x + stepSize || d.x > e[1];
  });
  svg.selectAll("text").classed("hidden", function(d) {
    return e[0] > d.x + stepSize || d.x > e[1];
  });
}

function brushend() {

  if (brush.empty())
  {
    svg.selectAll(".hidden").classed("hidden", false);
  }
  renderAll();
}

function processList(div) {
  var e = brush.extent();

  div.each(function() {
    var process = d3.select(this).selectAll(".processlist")
        .data(values);

    var processEnter = process.enter().append("div").attr("class", "processlist");

    processEnter.append("div")
           .attr("class", "pid")
           .text(function(d) { 
              if (brush.empty())
              {
                return d;
              } else {

                if (e[0] <= d && d <= e[1])
                {
                  return d;
                }
              }
            });
 
    process.exit().remove();
    process.order();

  });
}

document.addEventListener("DOMContentLoaded", openDB());
