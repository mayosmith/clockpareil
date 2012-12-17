/*
cpserver
DESCRIPTION: Nodejs program that checks the time, and calls out to other monitoring applications
History: 
Created 11.27.12
11.30.12 calls tccontroller to check tweet status
12.13.12 changed dispense output from 1 to 5; added calibrate to switch 
12.16.12 added expStrings external
*/

console.log('create server');
var util = require('util');
var url = require('url');
var http = require('http');
var cradle = require('cradle');
var expStr = require('./expStrings');
var clockFlag = false;
var tweetFlag = false;
var calibFlag = false;
//var cpFlag = false;  // true == dispense candy, false == do nothing
var lastHour = 99;
var now = new Date();
var output = "#0"; //test
var startTime = 1; //first hour of dispensing UTC (subtract 5 hrs for NYC)
var endTime = 24; //last hour of dispensing UTC


//URL for tcserver callback
var options = {
	host: expStr.hostStr,
	path: expStr.hostPath

};

require('http').createServer(function (request, response) {
	var urlObj = url.parse(request.url, true);
	
/* ---------------------------------------
test if it's the top of hour and that it's working hours
------------------------------------------*/
	var now = new Date();
	var hour = now.getHours();
	if(hour != lastHour){
		if (hour>=startTime && hour <=endTime){
		clockFlag = true;
		lastHour = hour;
		}
	}
	
/* ---------------------------------------
Test if there's a valid Tweet
------------------------------------------*/

	callback = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  //check response and change cpFlag accordingly
	  response.on('end', function () {
	    if(str == "#1")
			tweetFlag= true; 
	  });
	}

	http.request(options, callback).end();
	
	
	
//response.writeHead(200, {"Content-Type": "text/plain"});
output = "#0"
switch(urlObj.query["gs"]){
	case "1": //method returns #5 if clock or tweet flag are true
	if(clockFlag==true||tweetFlag==true){
		output = "#5"; //tell arduino to dispense chocolate
		clockFlag = false;
		tweetFlag = false;
		
	}	
	if(calibFlag == true){
		output = "#c";
		calibFlag = false;
	}
	break;
	
	case "hour":
	output = hour.toString(); //for debugging 
	break;

	case "minute":
	output = now.getMinutes().toString(); //for debugging 
	break;
	
	case "test":
	output = "ok";
	break;
	
	case expStr.apiTestStr:
	calibFlag = true;
	output = "calibrate..."
	break;	
	
	case expStr.apiTestStr:
	clockFlag = true;
	tweetFlag = true;
	output = "testmode..."
	break;
	
	
}


  response.end(output);

}).listen(8080);

console.log('listening on http://127.0.0.1:8080');
