var Q = require('q');

// function slowarr(x) {
//   var arr = [];
//   for (var i=0;i<x;i++) {
//     arr.push(slow(x));
//   }
//   return Q.all(arr);
// }

// function slow(x) {
//   return Q.promise(function(resolve,reject) {
//     setTimeout( function() {
//       resolve(x+1);
//     }, 500);
//   });
// }

// var a = 5;
// slow(a).then(console.log, console.log);
// slowarr(a).then(console.log, console.log);



function slow(a) {
  return Q.promise( function(resolve,reject) {
    setTimeout( function() {
      // reject("error");
      resolve(a+1);
    }, 500);
  });
}

var arr = [slow,slow,slow,slow];
var result = Q(10);
arr.forEach(function (f) {
    result = result.then(f);
});

result.then(console.log);


// arr.then(console.log);

// slow(10).then(function(v) {
//   console.log(v);
//   return slow(v);
// }).then(function(v) {
//   console.log(v);
//   return slow(v);
// }).then(function(v) {
//   console.log(v);
//   return slow(v);
// }).then( function(v) {
//   console.log(v);
// });










