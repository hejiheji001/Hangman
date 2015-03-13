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
	loadWords: function(url){
		var details = {
			url: url,
			method: "GET",
			headers: {
				"Content-Type":"text/plain"
			},
			onload: function(response){
				if(response.status === 200){
					var words = response.responseText.split(",");
					hangman.words["wordArr"] = words;
					console.log("Words Loaded");
					hangman.words["loaded"] = "TRUE";
				}
			}
		};
		this.ajax(details);
	},
	makeRequest: function(data, callback){
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
				console.log(jsonResult.data);
				callback();
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
		var wordLength = hangman.results["nextWord"]["word"].length;
		var word = hangman.results["guessWord"]["word"] || hangman.results["nextWord"]["word"];
		// var wongs = hangman.results["guessWord"]["word"] || hangman.results["nextWord"]["wrongGuessCountOfCurrentWord"];
		//当前长度的全部单词字符串
		var allWords = hangman.gameInfo["allWords"];

		// console.log(wordLength + "LENGTH");
		// console.log(hangman.words[wordLength] + "INITWD");

		//当前已知的位置及对应字母
		var charKnown = {};
		var num = 0;
		for (var m = 0; m < wordLength; m++) {
			if(word.charAt(m) !== "*"){
				charKnown[m] = word.charAt(m);
				num++;
			}
		}

		console.log(num + " KNOWN");

		if(num === 0 && wordLength <= 20){
			thisChar = hangman.charMap[wordLength][hangman.charMap["index"]];
			hangman.charMap["index"]++;
			console.log("Guess1:" + thisChar);
			this.gameInfo["guessed"].push(thisChar);
			return thisChar;
		}

		//去掉全部单词中模式不匹配的单词
		var matched = [];
		for (var k = 0; k < allWords.length; k++) {
			var temp = allWords[k];
			var index = 0;
			var total = 0;
			if(temp.length == wordLength){
				for(var chr in charKnown){
					total++;
					if(temp.charAt(chr) == charKnown[chr]){
						index++;
					}
				}
				if(index == total){
					matched.push(temp);
				}
			}
		}

		var matchedStr = matched.join("");

		//去掉已经猜过的
		var guessed = this.gameInfo["guessed"];
		for (var i = 0; i < guessed.length; i++) {
			matchedStr = matchedStr.split(guessed[i]).join("");
		};

		//取出当前可用字母中概率最高的，并加入已猜列表
		var max = 1;
		var equalTimes = [];
		for(var key in hangman.chars){
			var times = matchedStr.split(key).length - 1;
			if(times >= max){
				max = times;
				thisChar = key;
				hangman.chars[key] = times;
			}else if(times == max){//TODO：当times相等的时候 需要根据charMap/charMapFull选择
				equalTimes.push(key);
			}
		}
		this.gameInfo["guessed"].push(thisChar);
		hangman.gameInfo["allWords"] = matched;
		// var matchedWDs = [];
		// var charKnown = [];
		// var charKnownPos = [];
		console.log(matchedStr.length < 100 ? matchedStr : matchedStr.length);
		// console.log(JSON.stringify(hangman.chars));
		console.log("Guess:" + thisChar + " Times:" + max + " equalTimes:" + equalTimes);


		// if(charKnown.length === 0){
		// 	thisChar = hangman.charMap[wordLength][hangman.charMap["index"]];
		// }else{
		// 	for (var k = 0; k < allWords.length; k++) {
		// 		var temp = allWords[k];
		// 		var index = 0;
		// 		for (var n = 0; n < charKnownPos.length; n++) {
		// 			if(temp.charAt(charKnownPos[n]) == charKnown){
		// 				index++;
		// 			}
		// 		}
		// 		if(index == charKnownPos.length){
		// 			matchedWDs.push(temp);
		// 		}
		// 	}
		// 	var matchedWDStr = matchedWDs.join("");
		// 	var guessed = this.gameInfo["guessed"];
		// 	for (var i = 0; i < guessed.length; i++) {
		// 		matchedWDStr = matchedWDStr.split(guessed[i]).join("");
		// 	};

		// 	var max = 0;
		// 	for(var key in hangman.chars){
		// 		var times = matchedWDStr.split(key).length - 1;
		// 		hangman.chars[key] = times;
		// 		if(times > max){
		// 			max = times;
		// 			thisChar = key;
		// 		}
		// 	}
		// }
		// hangman.charMap["index"]++;
		// this.gameInfo["word"] = word;
		// this.gameInfo["guessed"].push(thisChar);
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
	initGame: function(){
		this.clearCache();
		this.loadWords("/words.txt");
		this.waitThenCall(
			function(){
				return hangman.words["loaded"] == "TRUE";
			},
			function(){
				hangman.startGame();
			}
		);
	},
	startGame: function(){
		var action = "startGame";
		var data = {"playerId": this.gameInfo["id"],"action": action};
		var callback = function(){
			hangman.nextWord();
		}
		this.makeRequest(JSON.stringify(data), callback);
		// this.waitThenCall(
		// 	function(){
		// 		return true || hangman.results["status"] == "OK";
		// 	},
		// 	function(){
		// 		hangman.nextWord();
		// 	}
		// );
	},
	nextWord: function(){
		var action = "nextWord";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action};
		var callback = function(){
			var wordLength = hangman.results[action]["word"].length;
			var wordArr = hangman.words["wordArr"];
			var allWords = hangman.words[wordLength];

			if(allWords.length === 0){
				for (var k = 0; k < wordArr.length; k++) {
					var temp = wordArr[k].trim();
					if(temp.length === wordLength){
						allWords.push(temp);
					}
				}
			}
			hangman.clearCache();
			// }
			hangman.gameInfo["allWords"] = allWords;
			hangman.guessWord();
		}
		this.makeRequest(JSON.stringify(data), callback);
		// this.waitThenCall(
		// 	function(){
		// 		return true || hangman.results["status"] == "OK";
		// 	},
		// 	function(){
		// 		callback();
		// 	}
		// );
	},
	guessWord: function(){
		var action = "guessWord";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action, "guess": this.getNextChar()};
		var callback = function(){
			if(hangman.results[action]["word"].indexOf("*") == -1){
				if(hangman.results[action]["totalWordCount"] < hangman.results["startGame"]["numberOfWordsToGuess"]){
					console.log(hangman.results[action]["totalWordCount"] + "Word");
					hangman.nextWord();
				}
				hangman.getResult();
			}else{
				// hangman.gameInfo["allWords"]
				hangman.guessWord();
			}
		}
		this.makeRequest(JSON.stringify(data), callback);
		// this.waitThenCall(
		// 	function(){
		// 		return true || hangman.results["status"] == "OK";
		// 	},
		// 	function(){
		// 		callback();
		// 	}
		// );
	},
	getResult: function(){
		var action = "getResult";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action};
		var callback = function(){
			console.log(hangman.results[action]);
		}
		this.makeRequest(JSON.stringify(data), callback);
		// this.waitThenCall(
		// 	function(){
		// 		return true || hangman.results["status"] == "OK";
		// 	},
		// 	function(){
		// 		console.log(hangman.results[action]);
		// 	}
		// );
	},
	submitResult: function(){
		var action = "getResult";
		var data = {"sessionId": this.gameInfo["sessionId"],"action": action};
		var callback = function(){
			console.log(hangman.results[action]);
		}
		this.makeRequest(JSON.stringify(data), callback);
		// this.waitThenCall(
		// 	function(){
		// 		return true || hangman.results["status"] == "OK";
		// 	},
		// 	function(){
		// 		console.log(hangman.results[action]);
		// 	}
		// );
	},
	clearCache:function(){
		hangman.results["guessWord"]["word"] = "";
		hangman.charMap["index"] = 0;
		// // hangman.results["status"] = "PENDING";
		hangman.gameInfo["allWords"] = "";
		hangman.gameInfo["matched"] = [];
		hangman.gameInfo["guessed"] = [];
		// var wds = this.words;
		// for(var key in wds){
		// 	wds[key] = [];
		// }
		// this.words["loaded"] = "FALSE";
		// // this.words["wordArr"] = [];

		// var chs = this.chars;
		// for(var key in chs){
		// 	chs[key] = 0;
		// }
		// this.results["guessWord"]["word"] = "";
		// this.charMap["index"] = 0;
	},
	gameInfo: {
		url: "https://strikingly-hangman.herokuapp.com/game/on",
		id: "hejiheji001@icloud.com",
		sessionId: "",
		allWords: "",
		matched: [],
		guessed: []
	},
	results: {
		status: "",
		startGame: {},
		nextWord: {},
		guessWord: {},
		getResult: {},
		submitResult: {}
	},
	// charMapFull:{
	// 	"1": ["A", "I"],
	// 	"2": ["A", "O", "E", "I", "M", "H", "N", "U", "S", "T", "Y", "B", "L", "P", "X", "D", "F", "R", "W", "G", "J", "K"],
	// 	"3": ["A", "E", "O", "I", "T", "S", "U", "P", "R", "N", "D", "B", "G", "M", "Y", "L", "H", "W", "F", "C", "K", "X", "V", "J", "Z", "Q"],
	// 	"4": ["A", "E", "S", "O", "I", "R", "L", "T", "N", "U", "D", "P", "M", "H", "C", "B", "K", "G", "Y", "W", "F", "V", "J", "Z", "X", "Q"],
	// 	"5": ["S", "E", "A", "R", "O", "I", "L", "T", "N", "U", "D", "C", "Y", "P", "M", "H", "G", "B", "K", "F", "W", "V", "Z", "X", "J", "Q"],
	// 	"6": ["E", "S", "A", "R", "I", "O", "L", "N", "T", "D", "U", "C", "M", "P", "G", "H", "B", "Y", "K", "F", "W", "V", "Z", "X", "J", "Q"],
	// 	"7": ["E", "S", "I", "A", "R", "N", "T", "O", "L", "D", "U", "C", "G", "P", "M", "H", "B", "Y", "F", "K", "W", "V", "Z", "X", "J", "Q"],
	// 	"8": ["E", "S", "I", "A", "R", "N", "T", "O", "L", "D", "C", "U", "G", "M", "P", "H", "B", "Y", "F", "K", "W", "V", "Z", "X", "Q", "J"],
	// 	"9": ["E", "S", "I", "R", "A", "N", "T", "O", "L", "C", "D", "U", "G", "M", "P", "H", "B", "Y", "F", "V", "K", "W", "Z", "X", "Q", "J"],
	// 	"10": ["E", "I", "S", "R", "A", "N", "T", "O", "L", "C", "D", "U", "G", "M", "P", "H", "B", "Y", "F", "V", "K", "W", "Z", "X", "Q", "J"],
	// 	"11": ["E", "I", "S", "N", "A", "R", "T", "O", "L", "C", "U", "D", "P", "M", "G", "H", "B", "Y", "F", "V", "K", "W", "Z", "X", "Q", "J"],
	// 	"12": ["E", "I", "S", "N", "T", "A", "R", "O", "L", "C", "P", "U", "M", "D", "G", "H", "Y", "B", "V", "F", "Z", "K", "W", "X", "Q", "J"],
	// 	"13": ["I", "E", "N", "T", "S", "A", "O", "R", "L", "C", "P", "U", "M", "G", "D", "H", "Y", "B", "V", "F", "Z", "X", "K", "W", "Q", "J"],
	// 	"14": ["I", "E", "T", "S", "N", "A", "O", "R", "L", "C", "P", "U", "M", "D", "H", "G", "Y", "B", "V", "F", "Z", "X", "K", "W", "Q", "J"],
	// 	"15": ["I", "E", "T", "N", "S", "O", "A", "R", "L", "C", "P", "U", "M", "D", "H", "G", "Y", "B", "V", "F", "Z", "X", "W", "K", "Q", "J"],
	// 	"16": ["I", "E", "T", "S", "N", "A", "O", "R", "L", "C", "P", "U", "M", "H", "D", "Y", "G", "B", "V", "F", "Z", "X", "W", "Q", "K", "J"],
	// 	"17": ["I", "E", "T", "N", "S", "O", "A", "R", "L", "C", "P", "U", "M", "H", "D", "G", "Y", "B", "V", "F", "Z", "X", "Q", "W", "J", "K"],
	// 	"18": ["I", "S", "E", "T", "O", "N", "R", "A", "L", "C", "P", "M", "U", "H", "D", "G", "Y", "B", "V", "Z", "F", "X", "Q", "W", "K"],
	// 	"19": ["I", "E", "T", "O", "N", "A", "S", "R", "L", "C", "P", "M", "U", "H", "D", "G", "Y", "B", "V", "F", "Z", "X", "K", "J", "Q", "W"],
	// 	"20": ["I", "O", "E", "T", "R", "S", "A", "N", "C", "L", "P", "H", "U", "M", "Y", "D", "G", "B", "Z", "V", "F", "K", "X", "J", "Q"],
	// 	index: 0,
	// 	extraChars: [],
	// 	delFrmExt: []
	// },
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
		"20": [],
		"21": [],
		"22": [],
		"23": [],
		"24": [],
		"25": [],
		"26": [],
		"27": [],
		"28": [],
		"29": [],
		"30": [],
		"loaded": "FALSE",
		"wordArr": []
	},
	chars:{
		"A": 0,
		"B": 0,
		"C": 0,
		"D": 0,
		"E": 0,
		"F": 0,
		"G": 0,
		"H": 0,
		"I": 0,
		"J": 0,
		"K": 0,
		"L": 0,
		"M": 0,
		"N": 0,
		"O": 0,
		"P": 0,
		"Q": 0,
		"R": 0,
		"S": 0,
		"T": 0,
		"U": 0,
		"V": 0,
		"W": 0,
		"X": 0,
		"Y": 0,
		"Z": 0
	}
};