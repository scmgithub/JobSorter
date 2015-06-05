var secrets = require('../secrets.json');
var assert = require('assert');
var Q = require('q');

var express = require('express');
var bodyParser = require('body-parser');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var forge = require('node-forge');

var app = express();
// any route prefixed with api will be authenticated
app.use('/api', expressJwt({secret:secrets.jwt}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));

// deal with jwt unauthorized sessions without spamming the terminal
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Not logged in');
  }
});

var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var ObjectId = Mongo.ObjectID;
var dburl = 'mongodb://localhost:27017/jobsorter';

// MongoClient.connect(dburl, function(err,db) {
//   assert.equal(null, err);
//   console.log("Connected to mongo server.");
//   db.close();
// });

app.get('/', function(req,res) {
  res.send('hi?');
  // res.redirect('/login');
});

app.get('/api/jobsearch', function(req,res) {
  var query = req.query.q;
console.log("query:" + query);
  MongoClient.connect(dburl, function(err,db) {
    assert.equal(null,err);

    //db.collection('joblistings').find().limit(10).toArray(function(err,docs) {
    // db text index gets called here
    db.collection('joblistings').find( { $text: { $search: query } },
   { score: { $meta: "textScore" } }).sort( { score: { $meta: "textScore" } } ).limit(10).toArray(function(err,docs) {
      assert.equal(null,err);
      res.send(docs);
      db.close();
    });
  });
});

app.get('/api/test', function(req,res) {
  res.send('secret data lies within!');
});

// var dbconnect = Q.nbind(MongoClient.connect, MongoClient, dburl); 

app.post('/login', function(req,res) {
  MongoClient.connect(dburl, function(err,db) {
    var cursor = db.collection('users').find({email: req.body.user.email}).limit(1);
    cursor.next(function(err,doc) {
      db.close();
      assert.equal(err, null);
      if (doc != null) {
        // hash entered password using stored salt and see if it matches the stored password_digest
        var password_digest = doc.password.slice(0,-16);
        var salt = doc.password.slice(-16);
        var md = forge.md.sha256.create();
        md.update(req.body.user.password + salt);
        if (md.digest().toHex() === password_digest) {
          //password matches so log in by passing token to client
          var profile = {
            email: doc.email,
            id: doc._id
          };
          var token = jwt.sign(profile,secrets.jwt, {expiresInMinutes:60*5});
          res.json({token:token});
        } else {
          //doesn't match so return error
          res.status(404).send('wrong password');
        }
      } else {
        res.status(404).send('user not found');
      }
    });
  });
});

app.post('/signup', function(req,res) {
  MongoClient.connect(dburl, function(err,db) {
    db.collection('users').find({email: req.body.user.email}).limit(1).count(function(err,count) {
      if (count > 0) {
        // email exists already so send error to client
        db.close();
        res.status(403).send("user already exists");
      } else {
        // email address not in db, so we can add our user
        var md = forge.md.sha256.create();
        var salt = forge.random.getBytesSync(16);
        md.update(req.body.user.password + salt);
        var password_digest = md.digest().toHex() + salt;

        db.collection('users').insertOne({
          email: req.body.user.email,
          password: password_digest
        }, function(err,result) {
          assert.equal(null,err);
          db.close();
          res.send(result);
        });
      }
    });
  });
});

app.get('/search', function(req,res) {
  res.json([1,2,3,4,5]);
});

app.listen(3000, function(){console.log('seekerclient started on port 3000');});