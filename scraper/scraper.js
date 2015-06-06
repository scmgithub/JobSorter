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
      db.close();
    });
  });
});

app.get('/todayslistings', function(req, res) {
  getToday();
});

function getToday() {
  var todaysJobs=[];
  var todaysJobsCount=null;
  var start=1;

  while (todaysJobsCount === null || todaysJobs.length < todaysJobsCount) {
    requester.getJobList({query:' ', job_type:' ',start:start, limit:'25', fromage:'0'}).then(function(data) {
      if (data.totalResults === 0) {
        console.log("Warning: returned totalResults is zero.");
      }
      if (todaysJobsCount === null || data.totalResults > todaysJobsCount) {
        todaysJobsCount = data.totalResults;
      }
        data.results.forEach(function(res) {
          todaysJobs.push(res);
        });
    });
  }
}

function getbatch(query,city,cur) {
  curconnections += 25;
  requester.getData(query,city,cur).then(function(data) {
    MongoClient.connect(dburl,function(err,db) {
      if (err) console.log("mongo err on index: "+cur);
      else {
        db.collection('joblistings').insert(data);
      }
      db.close();
    });
  });
}

var curbatch = 0;
var mytimer = null;
var loaded = false;

app.get('/load10k', function(req,res) {
  if (!loaded) {
    var curconnections = 0;
    var maxconnections = 100;
    MongoClient.connect(dburl, function(err,db) {
      function getbatchquick(query,city,cur) {
        console.log('starting '+cur);
        curconnections += 25;
        requester.getData(query,city,cur).then(function(data) {
          db.collection('joblistings').insert(data);
          curconnections -= 25;
          console.log('finished '+cur);
        }, function(reqerror) {
          console.log(reqerror + " cur="+cur);
        });
      }

      var curcounter = 0;
      function checkbatch() {
        if (curcounter >= 10000) {
          clearInterval(mytimer);
          db.close();
        } else if (curconnections < maxconnections) {
          getbatchquick("","New York,NY",curcounter);
          curcounter += 25;
        }
      }

      mytimer = setInterval(checkbatch, 500);
    });
    loaded = true;
  }
});

app.get('/load1k', function(req,res) {
  if (mytimer === null && curbatch === 0) {
    mytimer = setInterval( function() {
      if (curbatch < 1000) {
        console.log(curbatch);
        getbatch("","New York,NY",curbatch);
        curbatch += 25;
      } else {
        clearInterval(mytimer);
      }
    }, 1000);
    res.send('started load');
  } else {
    res.send('still loading. at: '+curbatch);
  }
});

app.get('/test', function(req,res) {
  // requester.getDataEvan("","New York, NY",10).then(function(data) {
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