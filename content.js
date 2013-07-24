var marks = new Array();
var cur = 0;

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.command == "search") {
			var flags = "g";
			if (request.caseInsensitive == true) {
				var flags = "gi";
			}
			var re = new RegExp(request.regexp, flags);
			var html = document.getElementsByTagName('body')[0];
			clear();
			html.normalize();
			recurse(html, re);
			displayCount();
		} else if (request.command == "clear") {
			clear();
		} else if (request.command == "prev") {
			moveToPrev();
		} else if (request.command == "next") {
			moveToNext();
		} else {
			console.log("Regex search: Invalid command");
		}
		if (marks.length > 0) {
			marks[cur].className="__regexp_search_selected";
			$('body').scrollTop($(marks[cur]).offset().top - 20);
		}
	});

function recurse(element, regexp) {
	if (element.nodeName == "MARK" || element.nodeName == "SCRIPT" ||
		element.nodeName == "NOSCRIPT" ||
		element.nodeName == "STYLE" ||
		element.nodeType == Node.COMMENT_NODE) {
		return;
	}
	if (element.nodeType != Node.TEXT_NODE && !$(element).is(':visible')) {
		return;
	}

	if (element.childNodes.length > 0) { 
		for (var i = 0; i < element.childNodes.length; i++) {
			recurse(element.childNodes[i], regexp);
		}
	}

	if (element.nodeType == Node.TEXT_NODE && element.nodeValue.trim() != '') {
		/*
		 * 1. Find all regex matches
		 * 2. Loop through matches, finding their starting positions
		 * 3. Add everything between the last match and this match as a text node
		 * 4. Add the match as a <mark>
		 * 5. After loop is finished, add remainder as text node
		 */
		var str = element.nodeValue;
		var matches = str.match(regexp);
		var parent = element.parentNode;
		if (matches != null) {
			parent.removeChild(element);
			
			var pos = 0;
			for (var i = 0; i < matches.length; i++) {
				var index = str.indexOf(matches[i], pos);
				var before = document.createTextNode(str.substring(pos, index));
				pos = index + matches[i].length;

				var mark = document.createElement('mark');
				mark.appendChild(document.createTextNode(matches[i]));

				parent.appendChild(before);
				parent.appendChild(mark);
				marks.push(mark);
			}
			parent.appendChild(document.createTextNode(str.substring(pos)));
		}
	}
}

function clear() {
	cur = 0;
	for (var i = 0; i < marks.length; i++) {
		var mark = marks[i];
		mark.parentNode.replaceChild(mark.firstChild, mark);
	}
	marks.length = 0;
	var s = document.getElementById("_regexp_search_count");
	if (s != null) {
		s.parentNode.removeChild(s);
	}
}

function displayCount() {
	if (marks.length > 0) {
		var num = cur + 1;
	} else {
		var num = 0;
	}
	var s = document.createElement('span');
	s.id = "_regexp_search_count";
	s.innerHTML = num + " of " + marks.length + " matches.";
	s.style.position = 'fixed';
	s.style.top = 0;
	s.style.left = 0;
	s.style.padding = '8px';
	s.style.background = 'rgba(255, 255, 0, 0.5)';
	s.addEventListener('mouseover', function(event) {
		document.getElementById("_regexp_search_count").style.opacity = "0";
	});
	s.addEventListener('mouseout', function(event) {
		document.getElementById("_regexp_search_count").style.opacity = "1";
	});
	document.getElementsByTagName('body')[0].appendChild(s);
}

function moveToNext() {
	if (cur < marks.length - 1) {
		marks[cur++].className="";
		marks[cur].className="__regexp_search_selected";
		updatePosText();
	}
}

function moveToPrev() {
	if (cur > 0) {
		marks[cur--].className="";
		marks[cur].className="__regexp_search_selected";
		updatePosText();
	}
}

function updatePosText() {
	if (marks.length > 0) {
		var elt = document.getElementById("_regexp_search_count");
		var num = cur + 1;
		elt.innerHTML = num + " of " + marks.length + " matches.";
	}
}
