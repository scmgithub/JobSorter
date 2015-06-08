var today = require('./getToday');
var fs = require('fs');

today.getToday(function(err,data) {
  if (err) 
    send_data=err+'\n';
  else
    send_data = data+'\n';

  fs.appendFile('/tmp/getTodaysListings.out', send_data, function (err) {
    if (err) throw err;
    process.exit();
  });
});
