/*
tccontroller
DESCRIPTION: Nodejs program that monitors Twitter stream, stores tweets in Cloudant CouchDB database
and includes method that returns tweetcount

HISTORY:
Created 11.27.12 testing and debugging
added if statement to test if data from twitter is null (deals with preamble)
todo: setup the twitter stream to stay open between requests from cpcontroller or arduino
12.1.12 change from streaming to search TODO hookup passphrase from database
12.4.12 added upp() passphrase change; check for undefined elememt if(data.results[0].id)
12.9.12 added id to db.save(tweetID.toString() 
*/


//console.log('create server');
var url = require('url');
var util = require('util');
var cradle = require('cradle');
var keys = require('./lib/tcreds');
var twitter = require('ntwitter');
var tcBacklog = 0; //counts tweet backlog
var MAX_BACKLOG = 2; //max tweet backlog
var INTERVAL = 30000;
var myVar=setInterval(function(){tweetTimer()},INTERVAL);
var searchPhrase = "phrase"; //twitter search phrase
var lastId = 274910537509388300; //274136860928929800;
var fromUser ="";
var fromUserID="";
var tweetID="n";
var tweetText="";
var saveTweet = false

	
/*-------------------------------------------
nTwitter
https://github.com/AvianFlu/ntwitter
not needed for search which can be anonymous, but it's here anyway to possibly help with rate limiting...
---------------------------------------------*/	
//console.log('start creating new twitter object');

var twit = new twitter({
  consumer_key:'KEY', //consumer key
  consumer_secret:'SECRET', //consumer secret
  access_token_key: 'TOKEN', //access token key
  access_token_secret: 'SECRET' //token secret
});


//Timer 
function tweetTimer()
{
	
/*-------------------------------------------
Begin Twitter Stream
---------------------------------------------*/
//274136860928929800 = id for clockpareil is up...
//this works in browser: https://twitter.com/search/?q=clockpareil&since_id=274136860928929800

	//saveTweet = false;
	twit.search(searchPhrase, {'since_id':lastId}, function(err, data) {

	console.log("data results: " + data);
	
	//if(typeof data.results[0].id != "undefined"){
	if(typeof data.results != 'undefined'){
			if(typeof data.results[0] != 'undefined'){
	
			if(data.results[0].id>lastId && tcBacklog < MAX_BACKLOG){
			tcBacklog++;			
			saveTweet = true;
			}
		
			lastId = data.results[0].id;
			fromUser =data.results[0].from_user;
			fromUserID=data.results[0].from_user_id;	
			tweetText=data.results[0].text;	
	
			}
	
	}	
	});


//Save tweet to Cloudant
/*-------------------------------------------
cradle & cloudant
https://github.com/cloudhead/cradle
---------------------------------------------*/

var conn = new(cradle.Connection)('HOST', 443,{
cache: true,
raw: false,
auth: {
username:"UNAME", //cloudant generated key
password:"PASSWORD"  //cloudant generated password
}	
	});
	
var db = conn.database('DBNAME');	
//var authdb = conn.database('clockpareilauth');	





if(saveTweet == true){
db.save(tweetID.toString(),{twituser: fromUser, twituserid: fromUserID, tweetid:tweetID, tweet:tweetText}, function (err, util){
	  if (err) {
	     console.log('cradle db error' + err);
	  } else {
	   console.log('success');
	  }

	});
saveTweet = false;	
}
			tweetID=lastId;

/*-------------------------------------------
End Twitter Search
---------------------------------------------*/

}// end timer function


require('http').createServer(function (request, response) {
	var urlObj = url.parse(request.url, true);
  response.writeHead(200, {"Content-Type": "text/plain"});
output = "#0"

//getpassphrase
//authdb.get('passphrase', function (err,doc){
//	console.log(doc.phrase);
//	searchPhrase = doc.phrase;
//});



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
	
	//update passphrase
	case "usp":
	   usp();
	break;
	
	//this works
	case "TEMP":
	tcBacklog =1;
	output = "testmode..."
	break;
}



  response.end(output);

}).listen(8080);
console.log('listening on http://127.0.0.1:8080');


/*-------------------------------------------
function usp()
DESCRIPTION: Update SearchPhrase -- Function that 
retreives twitter searchphrase from couchDB
created: 12.4.12
---------------------------------------------*/
function usp(){

	var conn = new(cradle.Connection)('CONNECTION', 443,{
	cache: true,
	raw: false,
	auth: {
	username:"U", //cloudant generated key
	password:"P"  //cloudant generated password
	}	

		});

	var db = conn.database('DBNAME');	
	

//retrieve passphrase from database

db.get('passphrase', function (err, doc) {
      console.log(doc);
		
		if (err) {
		     console.log('cradle db error' + err);
		  } else {
		  	if(doc)
			searchPhrase  = doc.phrase;
		  }
		


  });
	
}


