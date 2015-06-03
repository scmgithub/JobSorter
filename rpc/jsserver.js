var zerorpc = require('zerorpc');

var client = new zerorpc.Client();
client.connect("tcp://localhost:4242");
client.invoke("hello", "evan", function(error, res, more) {
  console.log(res);
});