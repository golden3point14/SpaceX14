var numCPUs;

$('#cyclesButton').css('background-color', '#315B7E');

function openDB()
{
	var openRequest = indexedDB.open("events", 8);

	openRequest.onsuccess = function(e)
	{
		console.log("openRequest success!");
		db = e.target.result;

		//get data
		var xactCPU = db.transaction(["numCPUs"], "readwrite");
		var storeCPU = xactCPU.objectStore("numCPUs");
		var resultCPU = storeCPU.get(1);

		//error handling
		resultCPU.onerror = function(e) {console.log("error", e.target.error.name);}

		//success
		resultCPU.onsuccess = function(e)
		{
			numCPUs = e.target.result;
			addOptions();
		}
	}
}

// adds each CPU to the select menu
// allows users to choose from all available CPUs
function addOptions()
{
	for (var i=0; i<numCPUs; i++)
	{
		var option = document.createElement("option");
		option.text = i;
		option.value = i;
		var select = document.getElementById("cpu");
		select.appendChild(option);
	}
}

 document.addEventListener("load", openDB());