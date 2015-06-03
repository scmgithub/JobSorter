function getData(next) {
  var data = [];
  for (var i=0;i<10;i++) {
    data.push({name: 'name'+i});
  }
  next(data);
}

module.exports = {
  getData: getData
}