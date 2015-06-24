angular.module('seeker',['ngRoute','ngSanitize'])
  .controller('nav', function($location, $rootScope, $scope, $window) {
    $rootScope.$on("$locationChangeStart", function(event,next,current) {
      if (typeof $window.sessionStorage.token === "undefined" && next.indexOf("#/app/") > -1) {
        event.preventDefault();
      }
    });
    $scope.logout = function() {
      delete $window.sessionStorage.email;
      delete $window.sessionStorage.token;
    };
  })

  .controller('home', function($scope, $http, $location) {
    $scope.submit = function() {
      if (!$scope.search) {$scope.search = {text: ""};}
      $location.path('/app/search').search({query: $scope.search.text});
    };
  })

  .controller('search', function($scope, $http, $location, $window) {

    // make sure modal gets inited properly
    $scope.mapurl='';
    $scope.modalindex = 0;
    $scope.ratings = [-1];

    $scope.findSimilarLDA = function(index) {
      $location.path('/app/search').search({ldasimilar: $scope.rows[index].jobid});
    };
    $scope.findSimilarBOW = function(index) {
      $location.path('/app/search').search({bowsimilar: $scope.rows[index].jobid});
    };

    // persist ratings
    $scope.rateFunction = function(index, rating) {
      $http.post('/api/review', {
        jobid: $scope.rows[index].jobid,
        rating: rating
      }).success(function (data) {
        console.log(data);
      }).error(function (data) {
        console.log(data);
      });
    };

    // run query and fill out results page
    if (typeof $location.search().query !== 'undefined') {
      var query = $location.search().query;
      $http({method: "GET", url: "http://"+location.hostname+":5000/mongosearch", params: {q: query, user: $window.sessionStorage.email}})
        .success(function(data) {
          // set initial ratings for all the joblistings. -1 means unrated
          $scope.airatings = data.results.map(function(row) {return row.airating;});
          $scope.ratings = data.results.map(function(row) {return row.rating;});
          // $scope.similarities = data.results.map(function(row) {return row.similarity;});
          $scope.rows = data.results.map(function(row) {return row.job;});
        })
        .error(function(err) {
          alert(err);
        });
    // run lda similarity query and fill out results
    } else if (typeof $location.search().ldasimilar !== 'undefined') {
      var jobid = $location.search().ldasimilar;
      $http({method: "GET", url: "http://"+location.hostname+":5000/ldasimilar", params: {j: jobid, user: $window.sessionStorage.email}})
        .success(function(data) {
          $scope.airatings = data.results.map(function(row) {return row.airating;});
          $scope.ratings = data.results.map(function(row) {return row.rating;});
          $scope.similarities = data.results.map(function(row) {return row.similarity;});
          $scope.rows = data.results.map(function(row) {return row.job;});
        })
        .error(function(err) {
          alert("aiserver returned error: "+err);
        });
    // run bow similarity query and fill out results
    } else if (typeof $location.search().bowsimilar !== 'undefined') {
      var jobid = $location.search().bowsimilar;
      $http({method: "GET", url: "http://"+location.hostname+":5000/bowsimilar", params: {j: jobid, user: $window.sessionStorage.email}})
        .success(function(data) {
          $scope.airatings = data.results.map(function(row) {return row.airating;});
          $scope.ratings = data.results.map(function(row) {return row.rating;});
          $scope.similarities = data.results.map(function(row) {return row.similarity;});
          $scope.rows = data.results.map(function(row) {return row.job;});
        })
        .error(function(err) {
          alert("aiserver returned error: "+err);
        });
    }

    // respond to click on snippet by showing modal
    $scope.showDetail = function(rowid) {
      $scope.modalindex = rowid;
      $scope.modaltitle = $scope.rows[rowid].title;
      $scope.modalbody = $scope.rows[rowid].job_detail;
      if ($scope.rows[rowid].lat && $scope.rows[rowid].long) {
        $scope.mapurl = 'http://maps.googleapis.com/maps/api/staticmap?markers='+$scope.rows[rowid].lat+','+$scope.rows[rowid].long+'&zoom=13&size=250x250';
      }
      $("#detailModal").modal();
    };
  })

  .controller('login', function($scope,$http,$window,$location) {
    $scope.submit = function() {
      $http.post("/login", {user: $scope.user})
        .success(function(data) {
          $window.sessionStorage.email = $scope.user.email;
          $window.sessionStorage.token = data.token;
          $location.path('app/home');
        })
        .error(function(err) {
          delete $window.sessionStorage.token;
          delete $window.sessionStorage.email;
          $scope.message = err;
        });
    }
  })
  .controller('signup', function($scope,$http,$window,$location) {
    $scope.user = {};
    var bothpasswordsupdated = false;
    $scope.submit = function() {
      if (!$scope.user.email || !$scope.user.password || !$scope.user.confirmpassword) {
        alert("email, password, and password confirmation are required");
      } else if ($scope.user.password !== $scope.user.confirmpassword) {
        alert("passwords don't match");
      } else {
        $http.post("/signup",{user: $scope.user})
          .success(function(res,status) {
            $http.post("/login", {user: $scope.user})
              .success(function(data) {
                $window.sessionStorage.email = $scope.user.email;
                $window.sessionStorage.token = data.token;
                $location.path('app/home');
              })
              .error(function(err) {
                delete $window.sessionStorage.email;
                delete $window.sessionStorage.token;
                alert(err);
              });
          })
          .error(function(res,status) {
            alert("err: "+res+" status: "+status);
          });
      }
    }
  })

  // intercepts the http requests before they are sent out and adds in an authorization token to the headers
  .factory('authInterceptor', function($q, $window, $location) {
    return {
      request: function(config) {
        config.headers = config.headers || {};
        if ($window.sessionStorage.token) {
          config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
        }
        return config;
      },
      response: function(response) {
        if (response.status === 401) {
          delete $window.sessionStorage.token;
          $location.path('login');
        }
        return response || $q.when(response);
      }
    };
  })

  .filter('newlines_as_br', function() {
    return function(input) {
      if (input) return input.replace(/[\n\f\r]/g,'<br>');
      else return null;
    }
  })
  .directive('starRating',
    function() {
      return {
        restrict : 'A',
        template : '<ul class="rating">'
           + ' <li ng-repeat="star in stars" ng-class="star" ng-click="toggle($index)">'
           + '  <i class="fa fa-star"></i>'
           + ' </li>'
           + '</ul>',
        scope : {
        ratingValue : '=',
        max : '=',
        onRatingSelected : '&'
      },
      link : function(scope, elem, attrs) {
        var updateStars = function() {
          scope.stars = [];
          for ( var i = 0; i < scope.max; i++) {
            scope.stars.push({
              filled : i < scope.ratingValue
            });
          }
        };
     
        scope.toggle = function(index) {
          scope.ratingValue = index + 1;
          scope.onRatingSelected({
           rating : index + 1
          });
        };
        
        scope.$watch('ratingValue', function(oldVal, newVal) {
          if (newVal) {
            updateStars();
          }
        });
      }
    };
  })

  .config(function($routeProvider, $httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');

    $routeProvider
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'login'
      })
      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'signup'
      })
      .when('/app/home', {
        templateUrl: 'views/home.html',
        controller: 'home'
      })
      .when('/app/search', {
        templateUrl: 'views/search.html',
        controller: 'search'
      })
      .otherwise({
        redirectTo: '/login'
      });
  });
