var assert = require('assert');
var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var ObjectId = Mongo.ObjectID;
var dburl = 'mongodb://localhost:27017/jobsorter';

MongoClient.connect(dburl, function(err,db) {
  assert.equal(null, err);
  console.log("Connected to mongo server.");

  db.collection('joblistings').createIndex( { snippet: "text", job_detail: "text" }, function(err, res) {
      assert.equal(null,err);
      console.log("Text Index created: " + res);
      db.close();
    });
});
