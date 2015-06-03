var express = require('express');
var bodyParser = require('body-parser');

var app = express();
// app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));


app.get('/', function(req,res) {
  res.redirect('index.html');
});

app.listen(3000, function(){console.log('seekerclient started on port 3000');});