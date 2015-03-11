var app = angular.module('chatApp', ['ui.bootstrap', 'ui.router', 'uiGmapgoogle-maps']);

app.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
})


app.controller('MapCtrl', ['$scope','GeolocationService', 'socket', 'uiGmapGoogleMapApi',
 function($scope, GeolocationService, socket, uiGmapGoogleMapApi){
 	$scope.latitude = 0;
	$scope.longitude = 0;

    $scope.position = null;


    $scope.locationMessage = "Determining geolocation...";


    //Executing promise from service to get users location
    GeolocationService().then(function (position) {

        $scope.position = position;
        getMyPosition($scope.position);
        console.log($scope.position);

    }, function (reason) {
        $scope.message = "Could not be determined."
    });

    var getMyPosition = function(position) {
    	$scope.latitude = position.coords.latitude;
    	$scope.longitude = position.coords.longitude;
    	//Promise for map to show when loaded
    	uiGmapGoogleMapApi.then(function(maps) {
			/*Useing reverse geo-coding to get address location
			from a latitude and longitude:
			https://developers.google.com/maps/documentation/javascript/geocoding#ReverseGeocoding */

			var geocoder = new google.maps.Geocoder();
    		var latlng = new google.maps.LatLng($scope.latitude, $scope.longitude);
			geocoder.geocode({'latLng': latlng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (results[1]) {
						$scope.exactLocation = results[1].formatted_address
						console.log($scope.exactLocation);

						//emitting users location and exactlocation to all others
    					socket.emit('send location', {
    						position: $scope.position,
    						namedLocation: $scope.exactLocation
    					});

					}
				} else {
					alert("Geocoder failed due to: " + status);
				}
			});
		});
    }

	$scope.$watch('exactLocation.text', function() {
       console.log('hey,location has changed to !' + $scope.exactLocation);
	});

}]);

app.controller('ChatCtrl', ['$scope', 'socket', '$state', '$timeout','GeolocationService', 'uiGmapGoogleMapApi',
 function($scope, socket, $state, $timeout, GeolocationService, uiGmapGoogleMapApi){
	
	$scope.username = '';
	//$scope.numberUsers = 0;
	$scope.typing = false;
	$scope.showMap = false;
	/*need to use object for msg.txt due to child scopes:
	http://jimhoskins.com/2012/12/14/nested-scopes-in-angularjs.html */
	$scope.msg = {
		txt: ''
	}

	$scope.usersTyping = [];
	$scope.msgs = [{
		user: '',
		message: '',
		position: '',
		exactPosition:'',
		map: { 
			center: { 
				latitude: '',
				longitude: ''
			},
			zoom: 12
		},
		marker: {
			coords: {
				latitude: '',
				longitude: ''
			}
		}

	}];



	$scope.addUser = function(){
		socket.emit('add user', $scope.username);
		$state.go('chat');
		$scope.username = '';
	} 

	$scope.userTyping = function(){
		if($scope.typing === false){
			console.log('we i n here');
			$scope.typing = true;

			if($scope.typing){
				socket.emit('typing');
			}
			//typing will timeout in 5s
			$timeout(function(){
				//console.log('time out executed');
				$scope.typing = false;
			}, 10000)
		}
	}
	//watching the typing scope to tell when user is not typng.
	$scope.$watch('typing', function(){
		if($scope.typing === false){
			socket.emit('stop typing');
		}
	})

	$scope.sendMsg = function(){
		socket.emit('send msg', $scope.msg.txt);
		console.log('i emitted it??: ' + $scope.msg.txt);
		$scope.msg.txt = '';
		$scope.typing = false;
	};

	socket.on('get msg', function(data){

		setPosition(data);
		//wil push the "data object" to array of msgs
		//in the setPosition function
		//tells angular to refresh constantly
		$scope.$digest();
	});
	socket.on('login', function(data){
		$scope.numberUsers = data.numUsers;
		console.log($scope.numberUsers);
		$scope.$apply();
	});
	// $scope.$watch('numberUsers', function() {
 //       console.log('hey, numberUsers has changed to !' + $scope.numberUsers);
 //   });

	socket.on('typing', function (data) {
    	$scope.usersTyping.push(data.username);
    	$scope.$digest();
  	});

  	socket.on('stop typing', function(data){
  		var index = $scope.usersTyping.indexOf(data.username)
  		console.log("index is: " + index);
  		if (index > -1) {
    		$scope.usersTyping.splice(index, 1);
		}
		$scope.$digest();
  	});

	// Whenever the server emits 'user left', do some sort of log?
	//and decrease active users
	socket.on('user left', function (data) {
		//log(data.username + ' left');
		$scope.numberUsers = data.numUsers;
		$scope.$digest();
	});

    var setPosition = function(data) {
    	//console.log("old data: ")
    	//console.log(data);
    	var latitude = data.position.coords.latitude;
    	var longitude = data.position.coords.longitude;

		data.map.center.latitude = latitude;
		data.map.center.longitude = longitude;

		data.marker.coords.latitude = latitude;
		data.marker.coords.longitude = longitude;
		
		//push completed data object to array of msgs
		//console.log("new data: ");
		//console.log(data);
		$scope.msgs.push(data);

    	//Promise for map to show when loaded
    	uiGmapGoogleMapApi.then(function(maps) {

		});


    }
}]);