var sidebar = document.getElementById('sidebar');

// Overview page
var mainDiv = document.createElement('div');
mainDiv.id = 'mainButton';
mainDiv.className = 'sidebutton';
mainDiv.innerHTML = "Overview";
mainDiv.setAttribute("onclick", "window.location.href='main.html';");
sidebar.appendChild(mainDiv);

// Cycles page
var cyclesDiv = document.createElement('div');
cyclesDiv.id = 'cyclesButton';
cyclesDiv.className = 'sidebutton';
cyclesDiv.innerHTML = "Cycles";
cyclesDiv.setAttribute("onclick", "window.location.href='cycles.html';");
sidebar.appendChild(cyclesDiv);

// Task Statistics page 
var statisticsDiv = document.createElement('div');
statisticsDiv.id = 'statisticsButton';
statisticsDiv.className = 'sidebutton';
statisticsDiv.innerHTML = "Task Statistics";
statisticsDiv.setAttribute("onclick", "window.location.href='histogram.html';");
sidebar.appendChild(statisticsDiv);

// Task State page
var processDiv = document.createElement('div');
processDiv.id = 'processButton';
processDiv.className = 'sidebutton';
processDiv.innerHTML = "Task State";
processDiv.setAttribute("onclick", "window.location.href='process.html';");
sidebar.appendChild(processDiv);

// Compare Tasks page
var compareDiv = document.createElement('div');
compareDiv.id = 'compareButton';
compareDiv.className = 'sidebutton';
compareDiv.innerHTML = "Compare Tasks";
compareDiv.setAttribute("onclick", "window.location.href='compare.html';");
sidebar.appendChild(compareDiv);

