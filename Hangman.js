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
		hangman.results["status"] = "PENDING";
		var details = {};
		details.url = this.gameInfo["url"];
		details.method = "POST";
		details.headers = {
			"Content-Type":"application/json"
		};
		details.data = data;
		details.onload = function(response){
			var thisAction = JSON.parse(this.data)["action"];
			if(response.responseText){
				var jsonResult = JSON.parse(response.responseText);
				hangman.gameInfo["sessionId"] = jsonResult["sessionId"];
				hangman.results[thisAction] = jsonResult["data"];
				hangman.results["status"] = "OK";
			}
		},
		details.onerror = function(response) {
			if(window.console){
				console.log(response);
			}
			hangman.results["status"] = "ERROR";
		}
		this.ajax(details);
	},
	leftMinusRight: function(arr1, arr2){
		if(arr2.length === 0){
			return arr1;
		}
		var diff = [];
		var str = arr2.join(",");
		for(var e in arr1){
			if(str.indexOf(arr1[e]) == -1){
				diff.push(arr1[e]);
			}
		}
		return diff;
	},
	getNextChar: function(){
		// var wordLength = hangman.results["nextWord"]["word"].length;
		// var word = {};
		// var oldWord = this.gameInfo["word"];
		// var oldWordStr = "";
		// var newWord = hangman.results["guessWord"]["word"] || "********************";
		// var bestFit = false;
		// for (var i = 0; i < wordLength; i++) {
		// 	oldWordStr += oldWord[i] || "";
		// 	word[i] = newWord.charAt(i);
		// };

		// if(oldWordStr != "" && oldWordStr != newWord){
		// 	console.log("CORRECT");
		// 	thisChar = "0";
		// }else{
		// 	thisChar =hangman.charMap[wordLength][hangman.charMap["index"]];
		// }


		// hangman.charMap["index"]++;
		// this.gameInfo["word"] = word;












		return thisChar ;
	},
	extraNextChar: function(wordLength){
		var extraChars = hangman.charMapFull["extraChars"];
		if(extraChars.length === 0){
			var usedChars = hangman.charMap[wordLength];
			var allChars = hangman.charMapFull[wordLength];
			extraChars = this.leftMinusRight(allChars, usedChars);
			hangman.charMapFull["extraChars"] = extraChars;
		}else{
			extraChars = this.leftMinusRight(extraChars, hangman.charMapFull["delFrmExt"]);
		}
		var thisChar = extraChars[0];
		var delFrmExt = hangman.charMapFull["delFrmExt"];
		delFrmExt.push(thisChar)
		hangman.charMapFull["delFrmExt"] = delFrmExt;
		return thisChar;
	},
	startGame: function(){
		var action = "startGame";
		var data = {"playerId": this.gameInfo["id"],"action": action};
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				hangman.nextWord();
			}
		);
	},
	nextWord: function(){
		var action = "nextWord";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action};
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				hangman.guessWord();
			}
		);
	},
	guessWord: function(){
		var action = "guessWord";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action, "guess": this.getNextChar()};
		console.log(data);
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				console.log(hangman.results[action]);
				if(hangman.results[action]["word"].indexOf("*") == -1){
					if(hangman.results[action]["totalWordCount"] < hangman.results["startGame"]["numberOfWordsToGuess"]){
						hangman.nextWord();
					}
					hangman.getResult();
				}else{
					hangman.guessWord();
				}
			}
		);
	},
	getResult: function(){
		var action = "getResult";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action};
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				console.log(hangman.results[action]);
			}
		);
	},
	submitResult: function(){
		var action = "getResult";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action};
		this.makeRequest(JSON.stringify(data));
		this.waitThenCall(
			function(){
				return hangman.results["status"] == "OK";
			},
			function(){
				console.log(hangman.results[action]);
			}
		);
	},
	gameInfo: {
		url: "https://strikingly-hangman.herokuapp.com/game/on",
		id: "hejiheji001@icloud.com",
		sessionId: "",
		word: {}
	},
	results: {
		status: "",
		startGame: {},
		nextWord: {},
		guessWord: {},
		getResult: {},
		submitResult: {}
	},
	charMapFull:{
		"1": ["A", "I"],
		"2": ["A", "O", "E", "I", "M", "H", "N", "U", "S", "T", "Y", "B", "L", "P", "X", "D", "F", "R", "W", "G", "J", "K"],
		"3": ["A", "E", "O", "I", "T", "S", "U", "P", "R", "N", "D", "B", "G", "M", "Y", "L", "H", "W", "F", "C", "K", "X", "V", "J", "Z", "Q"],
		"4": ["A", "E", "S", "O", "I", "R", "L", "T", "N", "U", "D", "P", "M", "H", "C", "B", "K", "G", "Y", "W", "F", "V", "J", "Z", "X", "Q"],
		"5": ["S", "E", "A", "R", "O", "I", "L", "T", "N", "U", "D", "C", "Y", "P", "M", "H", "G", "B", "K", "F", "W", "V", "Z", "X", "J", "Q"],
		"6": ["E", "S", "A", "R", "I", "O", "L", "N", "T", "D", "U", "C", "M", "P", "G", "H", "B", "Y", "K", "F", "W", "V", "Z", "X", "J", "Q"],
		"7": ["E", "S", "I", "A", "R", "N", "T", "O", "L", "D", "U", "C", "G", "P", "M", "H", "B", "Y", "F", "K", "W", "V", "Z", "X", "J", "Q"],
		"8": ["E", "S", "I", "A", "R", "N", "T", "O", "L", "D", "C", "U", "G", "M", "P", "H", "B", "Y", "F", "K", "W", "V", "Z", "X", "Q", "J"],
		"9": ["E", "S", "I", "R", "A", "N", "T", "O", "L", "C", "D", "U", "G", "M", "P", "H", "B", "Y", "F", "V", "K", "W", "Z", "X", "Q", "J"],
		"10": ["E", "I", "S", "R", "A", "N", "T", "O", "L", "C", "D", "U", "G", "M", "P", "H", "B", "Y", "F", "V", "K", "W", "Z", "X", "Q", "J"],
		"11": ["E", "I", "S", "N", "A", "R", "T", "O", "L", "C", "U", "D", "P", "M", "G", "H", "B", "Y", "F", "V", "K", "W", "Z", "X", "Q", "J"],
		"12": ["E", "I", "S", "N", "T", "A", "R", "O", "L", "C", "P", "U", "M", "D", "G", "H", "Y", "B", "V", "F", "Z", "K", "W", "X", "Q", "J"],
		"13": ["I", "E", "N", "T", "S", "A", "O", "R", "L", "C", "P", "U", "M", "G", "D", "H", "Y", "B", "V", "F", "Z", "X", "K", "W", "Q", "J"],
		"14": ["I", "E", "T", "S", "N", "A", "O", "R", "L", "C", "P", "U", "M", "D", "H", "G", "Y", "B", "V", "F", "Z", "X", "K", "W", "Q", "J"],
		"15": ["I", "E", "T", "N", "S", "O", "A", "R", "L", "C", "P", "U", "M", "D", "H", "G", "Y", "B", "V", "F", "Z", "X", "W", "K", "Q", "J"],
		"16": ["I", "E", "T", "S", "N", "A", "O", "R", "L", "C", "P", "U", "M", "H", "D", "Y", "G", "B", "V", "F", "Z", "X", "W", "Q", "K", "J"],
		"17": ["I", "E", "T", "N", "S", "O", "A", "R", "L", "C", "P", "U", "M", "H", "D", "G", "Y", "B", "V", "F", "Z", "X", "Q", "W", "J", "K"],
		"18": ["I", "S", "E", "T", "O", "N", "R", "A", "L", "C", "P", "M", "U", "H", "D", "G", "Y", "B", "V", "Z", "F", "X", "Q", "W", "K"],
		"19": ["I", "E", "T", "O", "N", "A", "S", "R", "L", "C", "P", "M", "U", "H", "D", "G", "Y", "B", "V", "F", "Z", "X", "K", "J", "Q", "W"],
		"20": ["I", "O", "E", "T", "R", "S", "A", "N", "C", "L", "P", "H", "U", "M", "Y", "D", "G", "B", "Z", "V", "F", "K", "X", "J", "Q"],
		index: 0,
		extraChars: [],
		delFrmExt: []
	},
	charMap: {
		"1": ["A", "I"],
		"2": ["A", "O", "E", "I", "U", "M", "B", "H"],
		"3": ["A", "E", "O", "I", "U", "Y", "H", "B", "C", "K"],
		"4": ["A", "E", "O", "I", "U", "Y", "S", "B", "F"],
		"5": ["S", "E", "A", "O", "I", "U", "Y", "H"],
		"6": ["E", "A", "I", "O", "U", "S", "Y"],
		"7": ["E", "I", "A", "O", "U", "S"],
		"8": ["E", "I", "A", "O", "U"],
		"9": ["E", "I", "A", "O", "U"],
		"10": ["E", "I", "O", "A", "U"],
		"11": ["E", "I", "O", "A", "D"],
		"12": ["E", "I", "O", "A", "F"],
		"13": ["I", "E", "O", "A"],
		"14": ["I", "E", "O"],
		"15": ["I", "E", "A"],
		"16": ["I", "E", "H"],
		"17": ["I", "E", "R"],
		"18": ["I", "E", "A"],
		"19": ["I", "E", "A"],
		"20": ["I", "E"],
		index: 0
	},
	words:{
		"1": [],
		"2": [],
		"3": [],
		"4": [],
		"5": [],
		"6": [],
		"7": [],
		"8": [],
		"9": [],
		"10": [],
		"11": [],
		"12": [],
		"13": [],
		"14": [],
		"15": [],
		"16": [],
		"17": [],
		"18": [],
		"19": [],
		"20": []
	}
};