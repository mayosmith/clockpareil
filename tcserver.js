/*
tccontroller
DESCRIPTION: Nodejs program that monitors Twitter stream, stores tweets in Cloudant CouchDB database
and includes method that returns tweetcount

HISTORY:
Created 11.27.12 testing and debugging
added if statement to test if data from twitter is null (deals with preamble)
todo: setup the twitter stream to stay open between requests from cpcontroller or arduino
12.1.12 change from streaming to search TODO hookup passphrase from database
*/


//console.log('create server');
var url = require('url');
var util = require('util');
var cradle = require('cradle');
var keys = require('./lib/tcreds');
var twitter = require('ntwitter');
var tcBacklog = 0; //counts tweet backlog
var MAX_BACKLOG = 2; //max tweet backlog
var INTERVAL = 30000; //30 seconds
var myVar=setInterval(function(){tweetTimer()},INTERVAL);
var searchPhrase = "search phrase here";
var lastId = 274910537509388300;//274136860928929800;
var fromUser ="";
var fromUserID="";
var tweetID="";
var tweetText="";


	
/*-------------------------------------------
nTwitter
https://github.com/AvianFlu/ntwitter
not needed for search which can be anonymous, but it's here anyway to possibly help with rate limiting...
---------------------------------------------*/	
//console.log('start creating new twitter object');

var twit = new twitter({
  consumer_key:'xxxxxxxxxxx', //consumer key
  consumer_secret:'xxxxxxxxxxx', //consumer secret
  access_token_key: 'xxxxxxxxxxx', //access token key
  access_token_secret: 'xxxxxxxxxxx' //token secret
});


//Timer 
function tweetTimer()
{

/*-------------------------------------------
Begin Twitter Search
---------------------------------------------*/


	twit.search(searchPhrase, {'since_id':lastId}, function(err, data) {
	 console.log(data);
	
	
	if(data.results){
			if(data.results[0].id>lastId && tcBacklog < MAX_BACKLOG)
			tcBacklog++;			
		
			lastId = data.results[0].id;
			fromUser =data.results[0].from_user;
			fromUserID=data.results[0].from_user_id;
			tweetID=lastId;
			tweetText=data.results[0].text;	
			console.log(data.results);
	}
		
	});


//Save tweet to Cloudant
/*-------------------------------------------
cradle & cloudant
https://github.com/cloudhead/cradle
---------------------------------------------*/

var conn = new(cradle.Connection)('https://yourname.cloudant.com', 443,{
cache: true,
raw: false,
auth: {
username:"xxxxxxxxxxxxxx", //cloudant generated key
password:"xxxxxxxxxxxxxx"  //cloudant generated password
}	

	});
	
var db = conn.database('databasename');	


if(fromUser != ""&&fromUserID!=""&&tweetID!=""&&tweetText!=""){
db.save({twituser: fromUser, twituserid: fromUserID, tweetid:tweetID, tweet:tweetText}, function (err, util){
	  if (err) {
	     console.log('cradle db error' + err);
	  } else {
	   console.log('success');
	  }

	});
}


/*-------------------------------------------
End Twitter Search
---------------------------------------------*/

}// end timer function


require('http').createServer(function (request, response) {
	var urlObj = url.parse(request.url, true);
  response.writeHead(200, {"Content-Type": "text/plain"});
output = "#0"

switch(urlObj.query["gs"]){
	case "1":
		if(tcBacklog>0){
			output = "#1"			
			tcBacklog--;
		}
	break;
		
	case "test":	
			output = "ok"
		
	break;
	
	//this works
	case "testmode":
	tcBacklog =1;
	output = "testmode..."
	break;
}



  response.end(output);

}).listen(8080);

console.log('listening on http://127.0.0.1:8080');
