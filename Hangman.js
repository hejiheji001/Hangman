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
	waitThenCall: function(waitWhat, callWhat, retryIn, timeout){
		var st = 0;
		var target = waitWhat();
		var waiting = self.setInterval(function(){
			st++;
			if(target){
				clearInterval(waiting);
				callWhat();
			}
			if(st >= ((timeout || 10000) / (retryIn || 100))){
				clearInterval(waiting);
			}
			target = waitWhat();
		},retryIn || 100);
	},
	makeRequest: function(data){
		var details = {};
		details.url = this.userInfo["url"];
		details.method = "POST";
		details.headers = {
			"Content-Type":"application/json"
		};
		details.data = data;
		details.onload = function(response){
			var thisAction = JSON.parse(this.data)["action"];
			if(response.responseText){
				var jsonResult = JSON.parse(response.responseText);
				hangman.userInfo["sessionId"] = jsonResult["sessionId"];
				hangman.results[thisAction] = jsonResult["data"];
				hangman.results["status"] = "OK";
			}
		},
		details.onerror =  function(response) {
			if(window.console){
				console.log(response);
			}
			hangman.results["status"] = "ERROR";
		};

		this.ajax(details);
	},
	startGame: function(){
		var action = "startGame";
		var data = {"playerId": this.userInfo["id"],"action": action};
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				hangman.nextWord();
			}
		)
	},
	nextWord: function(){
		var action = "nextWord";
		var data = {"sessionId": this.userInfo["sessionId"],"action": action};
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				console.log(hangman.results[action]);
			}
		)
	},
	guessWord: function(){
		// var action = "guessWord";
		// var data = {"sessionId": this.userInfo["sessionId"],"action": action};
		// this.makeRequest(JSON.stringify(data));
		// this.waitThenCall(
		// 	function(){
		// 		return hangman.results["status"] == "OK";
		// 	},
		// 	function(){
		// 		console.log(hangman.results[action]);
		// 	}
		// )
	},
	userInfo: {
		url: "https://strikingly-hangman.herokuapp.com/game/on",
		id: "hejiheji001@icloud.com",
		sessionId: ""
	},
	results: {
		status: "",
		startGame: {},
		nextWord: {},
		guessWord: {},
		getResult: {},
		submitResult: {}
	},

}