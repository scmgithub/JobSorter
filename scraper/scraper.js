var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mustacheExpress = require('mustache-express');

var requester = require('./indeedRequester');

var app = express();
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req,res) {
  res.redirect('index.html');
});

app.get('/test', function(req,res) {
  requester.getData().then(function(data) {
    // console.dir(data);
    res.render('test', {
      rows: data
    });
  }, function(error) {
    console.log(error);
  });
});

app.listen(3000, function(){console.log("scraper started on port 3000");});


//jobtitle company city state country snippet jobkey url