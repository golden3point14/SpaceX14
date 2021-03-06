/**
 * @author Dimitry Kudrayvtsev
 * @version 2.1
 * Modified by Wendy Brooks, May Lynn Forssen,
 * Alix Joe, and Rachel Macfarlane in 2015.
 */

// These four types refer to the four pages
// that have graphs. Each page has different requirements
// for their graph in terms of size or functionality,
// so by passing the type of chart desired into
// the graph we can customize as desired.
var mainType = "MAIN";
var cyclesType = "CYCLES";
var processType = "PROCESS";
var compareType = "COMPARE";

// global variables used to keep track of
// how zoomed in/translated a graph is.
// These values are put into local storage
// when the user leaves a page with a graph,
// so that the state is saved when the user returns.
// Additionally, any page with multiple graphs
// uses these values to remain consistently
// zoomed/translated across all graphs on the page.
var currScale;
var currTranslateX;
var currTranslateY;

// the main function used to create the graph.
d3.gantt = function(chartType) {
    var margin = {
      top : 20,
      right : 40,
      bottom : 20,
      left : 65
    };

    var timeDomainStart = 0;
    var timeDomainEnd = 0;

    var yAttribute = "cpu"; // By default, use cpu to group tasks on y axis
    var xStartAttribute = "normalStartTime"; //an attribute on events, with the time normalized to 0
    var xDuration = "processTime";
    var id = "";

    var taskTypes = [];
    var taskStatus = [];

    var height;
    // var height = document.body.clientHeight - margin.top - margin.bottom-5;
    switch(chartType) {
      case mainType:
        height = 300; // these heights would be better as percentages but we have not yet implemented that
        break;
      case cyclesType:
        height = 4000;
        break;
      default:
        height = 300;
        break;
    }

    var width;
    switch(chartType) {
      case compareType:
        width = document.body.clientWidth * 0.89 - margin.right - margin.left - 150; // slightly smaller due
                                                                                     // to remove button
        break;
      default:
        width = document.body.clientWidth - margin.right - margin.left - 150;
        break;
    }

    // for choosing the x and y attributes of the graph
    var keyFunction = function(d) {
      return d[xStartAttribute] + d[yAttribute] + (d[xStartAttribute] + d[xDuration]);
    };

    // for adjusting the rectangles basied on translating
    var rectTransform = function(d) {
      return "translate(" + x(d[xStartAttribute]) + "," + y(d[yAttribute]) + ")";
    };

    var x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd]).range([ 0, width ]);
    var y;
    var originalTimeDomainEnd;
    var xAxis;
    var yAxis;
    var yLabel = "CPU ";

    // initializes the time domain
    var initTimeDomain = function(tasks) {
      timeDomainStart = 0;
      originalTimeDomainEnd = timeDomainEnd;
    };

    // initializes the axes
    var initAxis = function() {

    // Set the pixel width of the scale based on the width of the window, and
    // the domain based on the time domain
    x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd]).range([ 0, width ]);
    // Y scale is ordinal and lists CPUs
    y = d3.scale.ordinal().domain(taskTypes).rangeBands([ 0, height - margin.top - margin.bottom ], .1);
    xAxis = d3.svg.axis().scale(x).orient("bottom");

    yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(
        function(d) { 
          if ((chartType === processType) || (chartType === compareType)) { return yLabel; }
          else { return yLabel + d; }
        }
      ).tickSize(0);
    };

    // creating functions to handle zooming and translating
    var zoom = d3.behavior.zoom()
      .scaleExtent([1,Infinity])
      .on("zoomstart", zoomStartHandler)
      .on("zoom", zoomed);


    var make_x_axis = function () {
      return xAxis;
    };
    
    // to adjust rectangles based on zooming (implicitly also translating)
    var zoomRectTransform = function(d) {
      if (d)
        return "translate(" + x(d[xStartAttribute]) + "," + y(d[yAttribute]) + ")scale(" + d3.event.scale + ", 1)";
    };

    // fires before a zoom event actually happens.
    // Ultimately this function is meant to make sure the
    // the graph is zoomed in and translated correctly
    // based on prior states before handling the zoom/translate event.
    function zoomStartHandler() {

      // gets the expected state from local storage
      getStorage(chartType.toLowerCase());

      // if there was a prior zoom state and it differs from what the graph thinks it was
      // set the graph's values to match the prior state.
      if (!isNaN(currScale) && currScale !== zoom.scale())
      {
        zoom.scale(currScale);
        x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width * zoom.scale()]);
        xAxis = d3.svg.axis().scale(x).orient("bottom");
        // d3.selectAll(".x.axis").call(xAxis);

        // Scale all rectangles
        d3.selectAll("rect").attr("transform", function(d){
                                          if (d)
                                            return "translate(" + x(d[xStartAttribute]) + "," + y(d[yAttribute]) + ")scale(" + zoom.scale() + ", 1)";
                                        })
      }

      d3.selectAll(".x.axis").call(xAxis);

      // if there was a prior tranlsate state and it differs from what the graph thinks it was
      // set the graph's values to match the prior state.
      if (currTranslateX !== zoom.translate()[0] || currTranslateY !== zoom.translate()[1])
      {

        if (isNaN(currTranslateX) || isNaN(currTranslateY))
        {
          // do nothing
        }

        else
        {
          zoom.translate([currTranslateX, currTranslateY]);

          var newX = margin.left + parseFloat(currTranslateX);
          d3.selectAll(".gantt-chart").attr("transform","translate(" + newX + "," + margin.top + ")");
        }
        
      }

    }

    // actually handles the zoom event
    function zoomed() {
      // Remake the x-axis
      x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width * d3.event.scale]);
      xAxis = d3.svg.axis().scale(x).orient("bottom");
      d3.selectAll(".x.axis").call(xAxis);

      // Move entire chart to be centered on mouse
      d3.selectAll(".gantt-chart").attr("transform","translate(" + d3.event.translate[0] + "," + margin.top + ")");

      // Scale all rectangles
      d3.selectAll("rect").attr("transform", zoomRectTransform);

      // change the stored values to reflect this change in state
      setStorage(chartType.toLowerCase());
    }

    // helper function to set appropriate items in local storage
    // based on the graph's current state.
  function setStorage(pageName)
  {
    // catches weirdness
    if (pageName === "") { return; }

    var scaleLevel = zoom.scale();
   
    var translateX = zoom.translate()[0];
   
    var translateY = zoom.translate()[1];
   
    window.localStorage.setItem(pageName + "CurrScale", scaleLevel);
    window.localStorage.setItem(pageName + "CurrTranslateX", translateX);
    window.localStorage.setItem(pageName + "CurrTranslateY", translateY);
  }

  // helper function to get the previous graph state from local storage.
  function getStorage(pageName)
  {
    if (pageName === "") { return; }

     currScale = parseFloat(window.localStorage.getItem(pageName+"CurrScale"));
     currTranslateX = parseFloat(window.localStorage.getItem(pageName+"CurrTranslateX"));
     currTranslateY = parseFloat(window.localStorage.getItem(pageName+"CurrTranslateY"));
  }
    
  // actually rendering the graph
  function gantt(tasks, div) {

    initTimeDomain(tasks);
    initAxis();

    var svg = d3.select(div)
                .append("svg")
                  .attr("class", "chart " + chartType)
                  .attr("id", id)
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .on("mousedown", function(d) {
                      zoomStartHandler();
                  })
                  .on("wheel", function(d) {
                      zoomStartHandler();
                  })
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
            case compareType:
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
          if (chartType == mainType)
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
    .transition();
    //.call(xAxis);
    
    svg.append("g").attr("class", "y axis").transition().call(yAxis);

    //load at correct zoom/translate
    zoomStartHandler();    

   return gantt;

    };
    // It seems that we don't actually use this function.
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

    /* Chart options
     */
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
