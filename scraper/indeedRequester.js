var request = require('request');
var cheerio = require('cheerio');
var secrets = require('../secrets.json');

var url = "http://api.indeed.com/ads/apisearch";
var publisher = "?publisher=" + secrets['indeed_api_key'];
var format = "&format=" + "json";
var query = "&q=" + "junior+web+developer";
var loc = "&l=" + "New+York%2C+NY";
var sort = "&sort=" + "";
var radius = "&radius=" + "10";
var site_type = "&st=" + "";
var job_type = "&jt=" + "fulltime";
var start = "&start=" + "";
var limit = "&limit=" + "";
var fromage = "&fromage=" + "last";
var filter = "&filter=" + "";
var latlong = "&latlong=" + "1";
var country = "&co=" + "us";
var channel = "&chnl=" + "";
var userip = "&userip=" + "1.2.3.4";
var useragent = "&useragent=" + "Mozilla/%2F4.0%28Firefox%29";
var ver = "&v=" + "2";

var search_url = url + publisher + format + query + loc + sort + radius + site_type + job_type + start + limit + fromage + filter + latlong + country + channel + userip + useragent + ver;

function getData(next) {
  var data = [];
  for (var i=0;i<10;i++) {
    data.push({name: 'name'+i});
  }
  next(data);
}

module.exports = {
  getData: getData
}