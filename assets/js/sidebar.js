var sidebar = document.getElementById('sidebar');

var mainDiv = document.createElement('div');
mainDiv.id = 'sidebutton';
mainDiv.className = 'sidebutton';
mainDiv.innerHTML = "Main";
mainDiv.setAttribute("onclick", "window.location.href='main.html';");
sidebar.appendChild(mainDiv);

// var cyclesDiv = document.createElement('div');
// cyclesDiv.id = 'sidebutton';
// cyclesDiv.className = 'sidebutton';
// cyclesDiv.innerHTML = "Cycles";
// sidebar.appendChild(cyclesDiv);

var distributionsDiv = document.createElement('div');
distributionsDiv.id = 'sidebutton';
distributionsDiv.className = 'sidebutton';
distributionsDiv.innerHTML = "Statistics";
distributionsDiv.setAttribute("onclick", "window.location.href='histogram.html';");
sidebar.appendChild(distributionsDiv);

// var statsDiv = document.createElement('div');
// statsDiv.id = 'sidebutton';
// statsDiv.className = 'sidebutton';
// statsDiv.innerHTML = "Distributions";
// sidebar.appendChild(statsDiv);

var searchDiv = document.createElement('div');
searchDiv.id = 'sidebutton';
searchDiv.className = 'sidebutton';
searchDiv.innerHTML = "Search";
searchDiv.setAttribute("onclick", "window.location.href='search.html';");
sidebar.appendChild(searchDiv);

// var processDiv = document.createElement('div');
// processDiv.id = 'sidebutton';
// processDiv.className = 'sidebutton';
// processDiv.innerHTML = "Process";
// sidebar.appendChild(processDiv);

// var compareDiv = document.createElement('div');
// compareDiv.id = 'sidebutton';
// compareDiv.className = 'sidebutton';
// compareDiv.innerHTML = "Compare";
// sidebar.appendChild(compareDiv);

