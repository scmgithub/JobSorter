# JobSorter
##### by Steve McIntosh and Evan Griffiths

#### What is it?
A Job listing aggregator that uses machine learning to provide Netflix-style rating estimation and similarity queries.

#### Want to [try it out](http://sleepylemur.ddns.net:3000/)?

(Log in with guest/guest if you'd rather not create an account.)

#### What tech does it use?
JobSorter is built with the FAME stack (Flask, Angular, Mongo, Express).

The main components are:

  - ai/aiserver.js:

  [Flask](http://flask.pocoo.org/) server that provides a JSON api to the other components. (Because python has the most machine learning support.) It processes the data in our Mongo database to generate similarity queries and numeric ratings. Uses [GenSim](https://radimrehurek.com/gensim/) and [scikit-learn](http://scikit-learn.org/stable/) to do the heavy algorithmic lifting.

  - scraper/getToday.js:

  Script for grabbing job listings from [Indeed](http://www.indeed.com/).

  - seeker/seeker.js

  Interface for job-seekers. Built with [AngularJS](https://angularjs.org/), [Express.js](http://expressjs.com/), and a little [Bootstrap](http://getbootstrap.com/) for basic styling.