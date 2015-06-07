var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var ObjectId = Mongo.ObjectID;
var dburl = 'mongodb://localhost:27017/jobsorter';


MongoClient.connect(dburl, function(err,db) {
  if (err) throw(err);
  var cursor = db.collection('joblistings').find({jobid: 'hi'}).limit(1);
  cursor.next(function(err,data) {
    console.log(data === null);
  });
  // db.close();
});