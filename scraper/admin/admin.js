var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mustacheExpress = require('mustache-express');
var assert = require('assert');

var requester = require('../indeedRequester');

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

app.get('/', function(req, res) {
  res.redirect('index.html');
});

app.post('/indeed/search', function(req, res) {

  var i = 1;
  var timer = setInterval(function() { 

//  for (var i=1; i<=parseInt(req.body.repeat); i++) {
    console.log("Executing Indeed scrape: '"+req.body.query+"'; ("+i+"/"+req.body.repeat+")"+(i<parseInt(req.body.repeat) ? ", timeout:"+req.body.timeout : "") );
    // requester.getData(req.body).then(function(data) {
    //   MongoClient.connect(dburl, function(err, db) {
    //     if (err) throw (err);
    //     if(data.length > 0) {
    //       db.collection('joblistings').insert(data);
    //       res.json(data);
    //     } else {
    //       res.send("No results found.")
    //     }
    //     db.close();
    //   });
    // });
    i++;
    if (i>req.body.repeat) {
      clearInterval(timer);
    }
  }, req.body.timeout * 1000);
  res.send("Fake query");
});

app.get('/db/query', function(req, res) {
  MongoClient.connect(dburl, function(err, db) {
    if (err) throw (err);
    var cursor = db.collection('joblistings').find().sort({_id:-1}).limit(parseInt(req.query.numInserts));
    cursor.toArray(function(err,docs) {
      assert.equal(null,err);
      res.send(docs);
      db.close();
    });
  });
});

var port = 3001;

app.listen(port, function() {
  console.log("admin server started on port "+port);
});