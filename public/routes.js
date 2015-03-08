angular.module('chatApp').config(function($stateProvider, $urlRouterProvider){

	$urlRouterProvider.otherwise('/login');
    // app state routing
    $stateProvider.
    state('login', {
        url: '/login',
        templateUrl: 'partials/login.html',
        controller: 'ChatCtrl'
    }).
    state('chat', {
    	url: '/chat',
    	templateUrl: 'partials/chat.html',
    	controller: 'ChatCtrl'
    });

});
