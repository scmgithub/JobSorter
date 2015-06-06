var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mustacheExpress = require('mustache-express');

var requester = require('./indeedRequester');

var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var ObjectId = Mongo.ObjectID;
var dburl = 'mongodb://localhost:27017/jobsorter';

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

app.get('/loadintodb', function(req,res) {
  requester.getData({}).then(function(data) {
    MongoClient.connect(dburl, function(err,db) {
      if (err) throw(err);
      db.collection('joblistings').insert(data);
      res.send('wrote to database maybe');
    });
  });
});

app.get('/test', function(req,res) {
  requester.getData({}).then(function(data) {
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