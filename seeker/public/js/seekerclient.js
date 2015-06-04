angular.module('seeker',['ngRoute'])
  .controller('nav', function($location, $rootScope, $scope, $window) {
    $rootScope.$on("$locationChangeStart", function(event,next,current) {
      if (typeof $window.sessionStorage.token === "undefined" && next.indexOf("#/app/") > -1) {
        event.preventDefault();
      }
    });
    $scope.logout = function() {
      delete $window.sessionStorage.token;
    };
  })

  .controller('home', function($scope, $http) {
    // $scope.message = "welcome home";
    $http.get('/api/test')
      .success(function(data) {
        $scope.message = data;
      });
  })

  .controller('login', function($scope,$http,$window,$location) {
    $scope.submit = function() {
      $http.post("/login", {user: $scope.user})
        .success(function(data) {
          $window.sessionStorage.token = data.token;
          $location.path('app/home');
        })
        .error(function(err) {
          delete $window.sessionStorage.token;
          alert(err);
        });
    }
  })
  .controller('signup', function($scope,$http,$window,$location) {
    $scope.user = {};
    $scope.submit = function() {
      if ($scope.user.password !== $scope.user.confirmpassword) {
        alert("passwords don't match");
      } else {
        $http.post("/signup",{user: $scope.user})
          .success(function(res,status) {
            $http.post("/login", {user: $scope.user})
              .success(function(data) {
                $window.sessionStorage.token = data.token;
                $location.path('app/home');
              })
              .error(function(err) {
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
      .otherwise({
        redirectTo: 'login'
      });
  });