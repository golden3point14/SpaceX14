/**
 * @author Dimitry Kudrayvtsev
 * @version 2.1
 */

var mainType = "MAIN";
var cyclesType = "CYCLES";
var processType = "PROCESS";

d3.gantt = function(chartType) {
    var FIT_TIME_DOMAIN_MODE = "fit";
    var FIXED_TIME_DOMAIN_MODE = "fixed";
    
    var margin = {
      top : 20,
      right : 40,
      bottom : 20,
      left : 65
    };

    var timeDomainStart = 0;
    var timeDomainEnd = 0;
    var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit

    var yAttribute = "cpu"; // By default, use cpu to group tasks on y axis
    var xStartAttribute = "normalStartTime";
    var xDuration = "processTime";
    var id = "";

    var taskTypes = [];
    var taskStatus = [];

    var height;
    // var height = document.body.clientHeight - margin.top - margin.bottom-5;
    switch(chartType) {
      case mainType:
        height = 300;
        break;
      case cyclesType:
        height = 4000;
        break;
      default:
        height = 300;
        break;
    }
    var width = document.body.clientWidth - margin.right - margin.left - 150;

    var keyFunction = function(d) {
      return d[xStartAttribute] + d[yAttribute] + (d[xStartAttribute] + d[xDuration]);
    };

    var rectTransform = function(d) {
      return "translate(" + x(d[xStartAttribute]) + "," + y(d[yAttribute]) + ")";
    };

    var x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd]).range([ 0, width ]);
    var y;
    var originalTimeDomainEnd;
    var xAxis;
    var yAxis;
    var yLabel = "CPU ";

    var initTimeDomain = function(tasks) {
      timeDomainStart = 0;
      originalTimeDomainEnd = timeDomainEnd;
    };

    var initAxis = function() {

    // Set the pixel width of the scale based on the width of the window, and
    // the domain based on the time domain
    x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd]).range([ 0, width ]);
    // Y scale is ordinal and lists CPUs
    y = d3.scale.ordinal().domain(taskTypes).rangeBands([ 0, height - margin.top - margin.bottom ], .1);
    xAxis = d3.svg.axis().scale(x).orient("bottom");

    yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(
        function(d) { 
          if (chartType === processType) { return yLabel; }
          else { return yLabel + d; }
        }
      ).tickSize(0);
    };

    var zoom = d3.behavior.zoom()
      .x(x)
      .scaleExtent([1,Infinity])
      .on("zoomstart", zoomStartHandler)
      .on("zoom", zoomed);


    var make_x_axis = function () {
      return xAxis;
    };
    
    var zoomRectTransform = function(d) {
      if (d)
        return "translate(" + x(d[xStartAttribute]) + "," + y(d[yAttribute]) + ")scale(" + d3.event.scale + ", 1)";
    };

    function zoomStartHandler() {
      var currScale = window.localStorage.getItem("currScale");
      var currTranslateX = window.localStorage.getItem("currTranslateX");
      var currTranslateY = window.localStorage.getItem("currTranslateY");

      if (currScale != zoom.scale())
      {
        zoom.scale(currScale);
      }

      if (currTranslateX != zoom.translate()[0] || currTranslateY != zoom.translate()[1])
      {

        console.log("should be numbers " + currTranslateX + ", " + currTranslateY);
        zoom.translate([currTranslateX, currTranslateY]);
      }

    }

    function zoomed() {

      // Remake the x-axis
      x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width * d3.event.scale]);
      xAxis = d3.svg.axis().scale(x).orient("bottom");
      d3.selectAll(".x.axis").call(xAxis);

      // Scale all rectangles
      d3.selectAll("rect").attr("transform", zoomRectTransform);


      d3.selectAll("svg").attr("width", width*d3.event.scale);


      // Move entire chart to be centered on mouse
      var newX = margin.left + d3.event.translate[0];
      d3.selectAll(".gantt-chart").attr("transform","translate(" + newX + "," + margin.top + ")");


      // TESTING
      // push d3.event.scale and d3.event.translate[0] up to local storage
      window.localStorage.setItem("currScale", zoom.scale());
      window.localStorage.setItem("currTranslateX", zoom.translate()[0]);
      window.localStorage.setItem("currTranslateY", zoom.translate()[1]);
      // next need a way to check if a given graphs scale/translate matches this or not, BEFORE mouse event takes affect
    }
    
  function gantt(tasks, div) {
    initTimeDomain(tasks);
    initAxis();

    var svg = d3.select(div)
                .append("svg")
                  .attr("class", "chart")
                  .attr("id", id)
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .call(zoom)
                .append("g")
                  .attr("class", "gantt-chart")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");


    var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

    svg.selectAll(".chart")
     .data(tasks, keyFunction).enter()
     .append("rect")
     .attr("class", function(d){ 
         if (d.activeName === '<idle>') {
           return 'idle';
         }
         var className;
         switch(chartType){
            case mainType:
              className = d.activeName+d.activePID;
              break;
            case processType:
              className = d.state;
              break;
            default:
              className = d.activeName;
              break;
         }
         return className;
       }) 
     .attr("y", 0)
     .attr("transform", rectTransform)
     .attr("height", function(d) { 
          if (d.eventType == "print") {return y.rangeBand(); }
          else {return y.rangeBand();}
        })
     .attr("width", function(d) { 
         if (d.eventType == "print") {return (x(d.duration));}
         else {return (x(d[xDuration]));}
         })
     .on("click", function(d) {
          if (isSearch)
          {
            scrollToTime(d.startTime);
          }
     })
     .on("mouseover", function(d) {      
            div.transition()        
                .duration(200)      
                .style("opacity", .9);      
            div .html("Running: " + d.activeName + "<br/>PID: " + d.activePID + 
              "<br/> Start time: " + d.startTime + "<br/> Duration: " + 
              d[xDuration] + "<br/> Extra Info: " + d.extraInfo
              )
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY - 28) + "px");    
            })                  
    .on("mouseout", function(d) {       
        div.transition()        
            .duration(200)      
            .style("opacity", 0);   
    });
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
    .transition()
    .call(xAxis);
    
    svg.append("g").attr("class", "y axis").transition().call(yAxis);

   return gantt;

    };
    
    gantt.redraw = function(tasks) {
        initTimeDomain(tasks);
        initAxis();
        var svg = d3.select("svg");

        var ganttChartGroup = svg.select(".gantt-chart");
        var rect = ganttChartGroup.selectAll("rect").data(tasks, keyFunction);
        
        rect.enter()
         .insert("rect",":first-child")
   .attr("class", function(d){ 
       if(taskStatus[d.status] == null){ return "bar";}
       return taskStatus[d.status];
       }) 
   .transition()
   .attr("y", 0)
   .attr("transform", rectTransform)
   .attr("height", function(d) { return y.rangeBand(); })
   .attr("width", function(d) { 
       return (x(d.processLength)); 
       });

        rect.transition()
          .attr("transform", rectTransform)
   .attr("height", function(d) { return y.rangeBand(); })
   .attr("width", function(d) { 
       return (x(d.processLength)); 
       });
        
  rect.exit().remove();

  svg.select(".x").transition().call(xAxis);
  svg.select(".y").transition().call(yAxis);
  
  return gantt;
    };

    gantt.margin = function(value) {
  if (!arguments.length)
      return margin;
  margin = value;
  return gantt;
    };

    gantt.timeDomain = function(value) {
  if (!arguments.length)
      return [ timeDomainStart, timeDomainEnd ];
  timeDomainStart = +value[0], timeDomainEnd = +value[1];
  return gantt;
    };

    /**
     * @param {string}
     *                vale The value can be "fit" - the domain fits the data or
     *                "fixed" - fixed domain.
     */
    gantt.timeDomainMode = function(value) {
  if (!arguments.length)
      return timeDomainMode;
        timeDomainMode = value;
        return gantt;

    };

    gantt.taskTypes = function(value) {
  if (!arguments.length)
      return taskTypes;
  taskTypes = value;
  return gantt;
    };
    
    gantt.taskStatus = function(value) {
  if (!arguments.length)
      return taskStatus;
  taskStatus = value;
  return gantt;
    };

    gantt.width = function(value) {
  if (!arguments.length)
      return width;
  width = +value;
  return gantt;
    };

    gantt.height = function(value) {
  if (!arguments.length)
      return height;
  height = +value;
  return gantt;
    };

    gantt.tickFormat = function(value) {
  if (!arguments.length)
      return tickFormat;
  tickFormat = value;
  return gantt;
    };

    gantt.timeDomain = function(value) {
      if (!arguments.length)
          return timeDomainEnd;
      timeDomainEnd = value;
      return gantt;
    };

    gantt.yAttribute = function(value) {
      if (!arguments.length)
          return yAttribute;
      yAttribute = value;
      return gantt;
    };

    gantt.xStartAttribute = function(value) {
      if (!arguments.length)
          return xStartAttribute;
      xStartAttribute = value;
      return gantt;
    };

    gantt.xDuration = function(value) {
      if (!arguments.length)
          return xDuration;
      xDuration = value;
      return gantt;
    };

    gantt.yLabel = function(value) {
      if (!arguments.length)
        return yLabel;
      yLabel = value;
      return gantt;
    }

    gantt.id = function(value) {
      if (!arguments.length)
        return id;
      id = value;
      return gantt;
    }
    
    return gantt;
};
