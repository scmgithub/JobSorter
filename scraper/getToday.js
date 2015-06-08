var request = require('request');
var Q = require('q');

var requester = require('./indeedRequester');

var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var ObjectId = Mongo.ObjectID;
var dburl = 'mongodb://localhost:27017/jobsorter';

function getToday(next) {

  MongoClient.connect(dburl, function(err, db) {
    if (err) {
      next(err,null);
    } else {
      var todaysJobs=[];
      var todaysJobsCount=null;
      var jobsRequested = 25;
      getJobListChunk(0);

      function getJobListChunk(start) {
        requester.getJobList({query:' ', job_type:' ',start:start, limit:'25', fromage:'0'}).then(function(data) {
          console.log("getting chunk "+start);
          if (todaysJobsCount === null) {
            todaysJobsCount = data.totalResults;
            console.log('todaysJobsCount: '+todaysJobsCount);
          }
          todaysJobs = todaysJobs.concat(data.results);

          if (jobsRequested >= todaysJobsCount) {
            // we've gotten all of today's jobs from the api so now check them against the db
            checkJobsInDB();
          } else {
            getJobListChunk(jobsRequested);
            jobsRequested += 25;
          }
        });
      }

      function checkJobsInDB() {
        var newPostings=[];
        // first make sure we don't have duplicates in todaysJobs
        arrhash = {};
        todaysJobs.forEach(function(job){arrhash[job.jobkey] = job;});
        todaysJobs = [];
        Object.keys(arrhash).forEach(function(job) {todaysJobs.push(arrhash[job]);});

        // now take uniqueified todaysJobs and check it against db
        Q.all(todaysJobs.map(function(posting) {
          return Q.promise(function(resolve,reject) {
            var cursor = db.collection('joblistings').find({jobid: posting.jobkey});
            cursor.next(function(err, data) {
              if (data === null) {
                console.log("Adding new posting with id: "+posting.jobkey);
                newPostings.push(posting);
              } else {
                console.log("Job posting with id "+posting.jobkey+" already exists in db.");
              }
              resolve(true);
            });
          });
        })).then(function() {
          getDetails(newPostings);
        });
      }

      function getDetails(postings) {
        var postingsForDB = Array(postings.length);
        var numRequestsSent = 0;

        var spawned = 0;
        var numWorkers = Math.min(100, postings.length); //max concurrent requests
        var spawner = setInterval(initialSpawn,50);

        // spawn workers
        var workersFinished = 0;
        function initialSpawn() {
          getOneJob();
          spawned += 1;
          if (spawned >= numWorkers) {
            clearInterval(spawner);
          }
        }

        function getOneJob() {
          if (numRequestsSent >= postings.length) {
            workersFinished += 1;
            console.log("worker "+workersFinished+" finished");
            if (workersFinished >= numWorkers) {
              console.log("all workers finished");
              // write new jobs to db
              persistToDb(postingsForDB);
            }
          } else {
            var index = numRequestsSent;
            numRequestsSent += 1;
            console.log('fetching detail for '+index);
            requester.getJobDetail(postings[index])
              .then(function(job) {
                postingsForDB[index] = job;
                console.log("inserted detail for "+index);
                setTimeout(getOneJob, 0);
              }, function(error) {
                console.log("error at index:"+index+"\n"+error);
                setTimeout(getOneJob, 0);
              });
          }
        }
      }
        
      function persistToDb(jobs) {
        // clear empty jobs from array by looping with foreach
        var clearedjobs = [];
        jobs.forEach(function(job){clearedjobs.push(job);});
        if (clearedjobs.length > 0) {
          db.collection('joblistings').insert(clearedjobs, function(err,records) {
            if (err) next(err,null);
            else next(null,'wrote '+clearedjobs.length+' jobs to database, maybe.');
          });
        } else {
          console.log("No new jobs to add to database at this time.");
          next(null,"No new jobs to add to database at this time.");
        }
      }
    }
  });
}  // end of GetToday()

module.exports = {
  getToday: getToday
};