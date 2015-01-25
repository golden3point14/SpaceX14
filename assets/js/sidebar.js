var sidebar = document.getElementById('sidebar');

var mainDiv = document.createElement('div');
mainDiv.id = 'mainButton';
mainDiv.className = 'sidebutton';
mainDiv.innerHTML = "Main";
mainDiv.setAttribute("onclick", "window.location.href='main.html';");
sidebar.appendChild(mainDiv);

var cyclesDiv = document.createElement('div');
cyclesDiv.id = 'cyclesButton';
cyclesDiv.className = 'sidebutton';
cyclesDiv.innerHTML = "Cycles";
cyclesDiv.setAttribute("onclick", "window.location.href='cycles.html';");
sidebar.appendChild(cyclesDiv);

var statisticsDiv = document.createElement('div');
statisticsDiv.id = 'statisticsButton';
statisticsDiv.className = 'sidebutton';
statisticsDiv.innerHTML = "Statistics";
statisticsDiv.setAttribute("onclick", "window.location.href='histogram.html';");
sidebar.appendChild(statisticsDiv);

// var statsDiv = document.createElement('div');
// statsDiv.id = 'sidebutton';
// statsDiv.className = 'sidebutton';
// statsDiv.innerHTML = "Distributions";
// sidebar.appendChild(statsDiv);

/*
var searchDiv = document.createElement('div');
searchDiv.id = 'searchButton';
searchDiv.className = 'sidebutton';
searchDiv.innerHTML = "Search";
searchDiv.setAttribute("onclick", "window.location.href='search.html';");
sidebar.appendChild(searchDiv);
*/

var processDiv = document.createElement('div');
processDiv.id = 'processButton';
processDiv.className = 'sidebutton';
processDiv.innerHTML = "Process";
processDiv.setAttribute("onclick", "window.location.href='process.html';");
sidebar.appendChild(processDiv);

// var compareDiv = document.createElement('div');
// compareDiv.id = 'sidebutton';
// compareDiv.className = 'sidebutton';
// compareDiv.innerHTML = "Compare";
// sidebar.appendChild(compareDiv);

