var request = require('request');


request({url: 'http://localhost:3000/testroute', timeout: 5000}, function(err,data) {
  console.log("err",err,"data",data);
});