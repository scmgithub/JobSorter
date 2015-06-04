var Q = require('q');

function slowarr(x) {
  var arr = [];
  for (var i=0;i<x;i++) {
    arr.push(slow(x));
  }
  return Q.all(arr);
}

function slow(x) {
  return Q.promise(function(resolve,reject) {
    setTimeout( function() {
      if (Math.random() < 0.1) {
        reject("err");
      } else {
        resolve(x+1);
      }
    }, 500);
  });
}

var a = 5;
slow(a).then(console.log, console.log);
slowarr(a).then(console.log, console.log);