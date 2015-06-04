angular.module('seeker',['ngRoute'])
  .controller('main', function($scope, $location) {
    $scope.msg = 'hi';
    
    $scope.doSearch = function() {
      $location.path('/search').search({'name' : 'dave'});
      // alert("In main controller.");
    }

    $scope.seeview2 = function() {
      $location.path('/view2');  
    }

  })

  .controller('search', function($scope, $location, $http) {
    $scope.msg = JSON.stringify($location.search());
    $http.get('http://localhost:3000/search')
      .success(function(data) {
        $scope.data = data;
      })
      .error(function(err) {
        alert("Error:" + err);
      });
    $scope.detailView = function(row) {
      alert(row);
    }
  })

  .config(function($routeProvider) {
    $routeProvider
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'search'
      })

      .when('/view2', {
        templateUrl: 'views/view2.html'
      });
  });
