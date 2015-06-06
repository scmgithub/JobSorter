var request = require('request');
var cheerio = require('cheerio');
var secrets = require('../secrets.json');
var Q = require('q');

var baseurl = "http://api.indeed.com/ads/apisearch";

var requestoptions = {
  publisher: secrets['indeed_api_key'],
  format: 'json',
  radius: '10',
  fromage: '14',
  co: 'us',
  v: '2',
  highlight: '0',
  sort: 'date',
  limit: '25',
  userip: '127.0.0.1',
  useragent: 'Mozilla/%2F4.0%28Firefox%29'
};
// var publisher = "?publisher=" + secrets['indeed_api_key'];
// var format = "&format=" + "json";
// var query = "&q=" + "junior+web+developer";
// var loc = "&l=" + "New+York%2C+NY";
// var sort = "&sort=" + "";
// var radius = "&radius=" + "10";
// var site_type = "&st=" + "";
// var job_type = "&jt=" + "fulltime";
// var start = "&start=" + "";
// var limit = "&limit=" + "";
// var fromage = "&fromage=" + "last";
// var filter = "&filter=" + "";
// var latlong = "&latlong=" + "1";
// var country = "&co=" + "us";
// var channel = "&chnl=" + "";
// var userip = "&userip=" + "1.2.3.4";
// var useragent = "&useragent=" + "Mozilla/%2F4.0%28Firefox%29";
// var ver = "&v=" + "2";
// var highlight = "&highlight="+"0";

// var search_url = queryurl + publisher + format + query + loc + sort + radius + site_type + job_type + start + limit + fromage + filter + latlong + country + channel + userip + useragent + ver + highlight;

function getJobDetail(job) {
  var result = {};
  result['jobid'] = job.jobkey;
  result['title'] = job.jobtitle;
  result['company'] = job.company;
  result['location'] = job.formattedLocation;
  result['snippet'] = job.snippet;
  result['url'] = job.url;

  return Q.promise(function(resolve,reject) {
    request (job.url, function (jerror, jresponse, jbody) {
      if(!jerror && jresponse.statusCode===200) {
        var $ = cheerio.load(jbody);
        result['job_detail'] = $('#job_summary').text();
        resolve(result);
      } else {
        reject("Something went wrong:\nurl:"+job.url+"\nresponse code:\n"+jresponse.statusCode);
      }
    });
  });
}

function getData(context) {
  var queryurl = "http://api.indeed.com/ads/apisearch";
  var publisher = "?publisher=" + secrets['indeed_api_key'];
  var format = "&format=" + "json";
  var query, loc, sort, radius, site_type, job_type, start, limit, fromage, filter, latlong, country, channel, highlight;

  query = "&q=" + (context.query ? context.query : "junior+web+developer");
  loc = "&l=" + (context.loc ? context.loc : "New+York%2C+NY");
  sort = "&sort=" + (context.sort ? context.sort : "");
  radius = "&radius=" + (context.radius ? context.radius : "10");
  site_type = "&st=" + (context.site_type ? context.site_type : "");
  job_type = "&jt=" + (context.job_type ? context.job_type : "fulltime");
  start = "&start=" + (context.start ? context.start : "");
  limit = "&limit=" + (context.limit ? context.limit : "");
  fromage = "&fromage=" + (context.fromage ? context.fromage : "last");
  filter = "&filter=" + (context.filter ? context.filter : "");
  latlong = "&latlong=" + (context.latlong ? context.latlong : "1");
  country = "&co=" + (context.country ? context.country : "us");
  channel = "&chnl=" + (context.channel ? context.channel : "");
  highlight = "&highlight=" + (context.highlight ? context.highlight : "0");

  var userip = "&userip=" + "1.2.3.4";
  var useragent = "&useragent=" + "Mozilla/%2F4.0%28Firefox%29";
  var ver = "&v=" + "2";

  var search_url = queryurl + publisher + format + query + loc + sort + radius + site_type + job_type + start + limit + fromage + filter + latlong + country + channel + highlight + userip + useragent + ver;

  return Q.promise(function(resolve,reject) {
    request(search_url, function (error, response, body) {
      var results = [];
      if(!error && response.statusCode === 200) {
        var data = JSON.parse(body);
        var joblist = data.results;
        var detaillist = joblist.map(getJobDetail);
        resolve(Q.all(detaillist));
      } else {
        reject("Something went wrong:\nsearch:"+search_url+"\nresponse code:\n"+response.statusCode);
      }
    });
  });
}

function getDataEvan(query, city,start) {
  return Q.promise(function(resolve,reject) {
    requestoptions['q'] = query;
    requestoptions['l'] = city;
    requestoptions['start'] = start;
    var querystring = Object.keys(requestoptions).map(function(k) {return k + '=' + encodeURIComponent(requestoptions[k]);}).join('&');
    var search_url = baseurl + "?" + querystring;
    // console.log(search_url);
    request(search_url, function (error, response, body) {
      var results = [];
      if(!error && response.statusCode === 200) {
        var data = JSON.parse(body);
        var joblist = data.results;
        var detaillist = joblist.map(getJobDetail);
        resolve(Q.all(detaillist));
      } else {
        reject("Something went wrong:\nsearch:"+search_url+"\nresponse code:\n"+response.statusCode);
      }
    });
  });
}

module.exports = {
  getData: getData
};