/**
 * @author Dimitry Kudrayvtsev
 * @version 2.1
 */

var mainType = "MAIN";
var cyclesType = "CYCLES";

d3.gantt = function(type) {
    var FIT_TIME_DOMAIN_MODE = "fit";
    var FIXED_TIME_DOMAIN_MODE = "fixed";
    
    var margin = {
      top : 20,
      right : 40,
      bottom : 20,
      left : 55
    };

    var timeDomainStart = 0;
    var timeDomainEnd = 0;
    var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit
    var yAttribute = "cpu"; // By default, use cpu to group tasks on y axis

    var taskTypes = [];
    var taskStatus = [];

    // var height = document.body.clientHeight - margin.top - margin.bottom-5;
    var height = 300;
    var width = document.body.clientWidth - margin.right - margin.left - 150;

    var keyFunction = function(d) {
      return d.normalStartTime + d[yAttribute] + (d.normalStartTime + d.processLength);
    };

    var rectTransform = function(d) {
      return "translate(" + x(d.normalStartTime) + "," + y(d[yAttribute]) + ")";
    };

    var x;
    var y;
    var xAxis;
    var yAxis;

    var initTimeDomain = function(tasks) {
      timeDomainStart = 0;
    };

    var initAxis = function() {

    // Set the pixel width of the scale based on the width of the window, and
    // the domain based on the time domain
    x = d3.scale.linear().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]);
    // Y scale is ordinal and lists CPUs
    y = d3.scale.ordinal().domain(taskTypes).rangeBands([ 0, height - margin.top - margin.bottom ], .1);
    xAxis = d3.svg.axis().scale(x).orient("bottom");

    yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(function(d) {return "CPU " + d;}).tickSize(0);
    };

    var zoom = d3.behavior.zoom()
      .on("zoom", zoomed);

    var make_x_axis = function () {
      return xAxis;
    };
    
    var zoomRectTransform = function(d) {
      var newX = x(d.normalStartTime) + d3.event.translate[0];
      return "translate(" + newX + "," + y(d[yAttribute]) + ")scale(" + d3.event.scale + ",1)";
    };

    function zoomed() {
      d3.selectAll("rect").attr("transform", zoomRectTransform);
    }
    
  function gantt(tasks) {

    initTimeDomain(tasks);
    initAxis();

    var svg = d3.select(".content")
                .append("svg")
                  .attr("class", "chart")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
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
         if (d.name === '<idle>') {
           return 'idle';
         }
         return d.name + d.pid;
       }) 
     .attr("y", 0)
     .attr("transform", rectTransform)
     .attr("height", function(d) { 
          if (d.eventType == "print") {return y.rangeBand(); }
          else {return y.rangeBand();}
        })
     .attr("width", function(d) { 
         if (d.eventType == "print") {return (x(d.duration));}
         else {return (x(d.processLength));}
         })
     .call(zoom)
     .on("mouseover", function(d) {      
            div.transition()        
                .duration(200)      
                .style("opacity", .9);      
            div .html("Process name: " + d.name + "<br/> PID: " + d.pid + 
              "<br/> Start time: " + d.startTime + "<br/> Duration: " + 
              d.processLength + "<br/> Extra Info: " + d.extraInfo)
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

   svg.append("svg:g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").call(zoom); 

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
    
    return gantt;
};
