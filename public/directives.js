app.directive('myScrollDirective', function() {
	return function(scope, $element, attrs) {

		var container = document.getElementById('chat-wrap');
		if (scope.$last){
			//window.alert("im the last!");
			var updateScroll = function() {
				container.scrollTop = container.scrollHeight;
			}
			//scroll to bottom only if a msgs array changes!
			scope.$watch('msgs', function() {
       			updateScroll();
			});
		}
	};
});
