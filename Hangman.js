var hangman = {
	ajax: function(details) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			var responseState = {
				responseXML: (xmlhttp.readyState == 4 ? xmlhttp.responseXML : ''),
				responseText: (xmlhttp.readyState == 4 ? xmlhttp.responseText : ''),
				readyState: xmlhttp.readyState,
				responseHeaders: (xmlhttp.readyState == 4 ? xmlhttp.getAllResponseHeaders() : ''),
				status: (xmlhttp.readyState == 4 ? xmlhttp.status : 0),
				statusText: (xmlhttp.readyState == 4 ? xmlhttp.statusText : '')
			};
			if (details.onreadystatechange) {
				details.onreadystatechange(responseState);
			}
			if (xmlhttp.readyState == 4) {
				if (details.onload && xmlhttp.status >= 200 && xmlhttp.status < 300) {
					details.onload(responseState);
				}
				if (details.onerror && (xmlhttp.status < 200 || xmlhttp.status >= 300)) {
					details.onerror(responseState);
				}
			}
		};
		try {
			xmlhttp.open(details.method, details.url);
		} catch (exception) {
			if (details.onerror) {
				details.onerror({
					responseXML: '',
					responseText: '',
					readyState: 4,
					responseHeaders: '',
					status: 403,
					statusText: 'Forbidden'
				});
			}
			return;
		}
		if (details.headers) {
			for (var prop in details.headers) {
				if(details.headers.hasOwnProperty(prop)){
					xmlhttp.setRequestHeader(prop, details.headers[prop]);
				}
			}
		}
		xmlhttp.send((typeof(details.data) != 'undefined') ? details.data : null);
	},
	makeRequest: function(data, onloadCallback){
		var details = {};
		details.url = this.userInfo.url;
		details.method = "POST";
		details.headers = {
			"Content-Type":"application/json"
		};
		details.data = data
		details.onload = onloadCallback;
		details.onerror =  function(response) {
			if(window.console){
				console.log(response);
			}
		};
		//console.log(JSON.stringify(details));
		this.ajax(details);
	},
	startGame: function(){
		var data = {'playerId': this.userInfo.id,'action': 'startGame'};
		var onloadCallback = function(response){
			console.log(response.responseText);
		};
		this.makeRequest(JSON.stringify(data), onloadCallback);
	},
	userInfo: {
		url: "https://strikingly-hangman.herokuapp.com/game/on",
		id: "hejiheji001@icloud.com"
	}
}