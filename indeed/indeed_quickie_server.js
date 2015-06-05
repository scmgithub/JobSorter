var express=require('express');
var app=express();
app.use(express.static(__dirname+'/public'));
var secrets = require('./secrets.json');
var ejs = require('ejs');
app.set('view engine', 'ejs');
var request = require('request');
var cheerio = require('cheerio');



var url = "http://api.indeed.com/ads/apisearch";    // required
var publisher = "?publisher=" + secrets['indeed_api_key'];    // required
var format = "&format=" + "json";    // required
var query = "&q=" + "";
var loc = "&l=" + "New+York%2C+NY";
var sort = "&sort=" + "date";
var radius = "&radius=" + "50";
var site_type = "&st=" + "";
var job_type = "&jt=" + "";
var start = "&start=" + "";
var limit = "&limit=" + "";
var fromage = "&fromage=" + "last";
var filter = "&filter=" + "";
var latlong = "&latlong=" + "1";
var country = "&co=" + "us";
var channel = "&chnl=" + "";
var userip = "&userip=" + "1.2.3.4";    // required
var useragent = "&useragent=" + "Mozilla/%2F4.0%28Firefox%29";    // required
var ver = "&v=" + "2";    // required

var search_url = url + publisher + format + query + loc + sort + radius + site_type + job_type + start + limit + fromage + filter + latlong + country + channel + userip + useragent + ver;

//console.log (search_url);

var results = {};

request(search_url, function (error, response, body) {
	if(!error && response.statusCode===200) {
		data=JSON.parse(body);
		var joblist = data.results;
		joblist.forEach(function(job) {
			results['jobid'] = job.jobkey;
			results['title'] = job.jobtitle;
			results['company'] = job.company;
			results['location'] = job.formattedLocation;
			results['snippet'] = job.snippet;
			results['url'] = job.url;

// 			request (job.url, function (jerror, jresponse, jbody) {
// 				if(!jerror && jresponse.statusCode===200) {
// 					$ = cheerio.load(jbody);
// //					results['job_detail'] = $('#job_summary').text();
// 				} else {
// 					console.log("Something went wrong:\nurl:"+job.url+"\nresponse code:\n"+jresponse.statusCode);
// 				}
// 				console.log("Results?");
// 			});
//			console.dir(results);
			console.dir(data);
		});
	} else {
		console.log("Something went wrong:\nsearch:"+search_url+"\nresponse code:\n"+response.statusCode);
	}
});
