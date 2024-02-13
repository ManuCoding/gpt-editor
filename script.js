const editor=document.getElementById("editor");
const codeDisplay=document.getElementById("code-display");
const cursorElement=document.createElement("div");
cursorElement.className="cursor";
codeDisplay.appendChild(cursorElement);

const bracketPairs={
	"{": "}",
	"[": "]",
	"(": ")"
};

const quotes={
	"'": "'",
	'"': '"'
};

const closing=new Set(Object.values(bracketPairs));

let prevLines=[];

editor.addEventListener("input",function(e) {
	updateCodeDisplay();
});

editor.addEventListener("keydown",function(e) {
	const key=e.key;
	if(key in bracketPairs) {
		e.preventDefault();
		handleBracket(key);
	}
	if(key in quotes) {
		e.preventDefault();
		handleQuote(key);
	}
	if(closing.has(key)) {
		e.preventDefault();
		handleClosing(key);
	}
	if(key=="Enter") {
		e.preventDefault();
		handleEnter();
	}
	if(key=="Tab") {
		e.preventDefault();
		handleTab();
	}
	updateCursor();
});
editor.addEventListener("keyup",function(e) {
	updateCursor();
});
editor.addEventListener("click",function(e) {
	updateCursor();
});

function handleBracket(key) {
	const cursorPos=editor.selectionStart;
	const selectionEnd=editor.selectionEnd;
	const code=editor.value;
	const closing=bracketPairs[key];
	editor.value=code.slice(0,cursorPos)+key+code.slice(cursorPos,selectionEnd)+closing+code.slice(selectionEnd);
	editor.setSelectionRange(cursorPos+1,selectionEnd+1);
	updateCodeDisplay();
}
function handleQuote(key) {
	const cursorPos=editor.selectionStart;
	const selectionEnd=editor.selectionEnd;
	const code=editor.value;
	if(code[cursorPos]!=key) {
		editor.value=code.slice(0,cursorPos)+key+code.slice(cursorPos,selectionEnd)+key+code.slice(selectionEnd);
	}
	editor.setSelectionRange(cursorPos+1,selectionEnd+1);
	updateCodeDisplay();
}
function handleClosing(key) {
	const cursorPos=editor.selectionStart;
	const selectionEnd=editor.selectionEnd;
	const code=editor.value;
	if(code[cursorPos]==key) {
		editor.value=code.slice(0,cursorPos)+code.slice(selectionEnd);
	} else {
		editor.value=code.slice(0,cursorPos)+key+code.slice(selectionEnd);
	}
	editor.setSelectionRange(cursorPos+1,cursorPos+1);
	updateCodeDisplay();
}
function handleEnter() {
	const cursorPos=editor.selectionStart;
	const code=editor.value;
	const lineStart=code.lastIndexOf("\n",cursorPos-1)+1;
	const lineEnd=code.indexOf("\n",cursorPos);
	const line=code.slice(lineStart,lineEnd);
	const indentation=line.match(/^\s*/)[0];
	if(code.substr(cursorPos-1,2)=="{}") {
		editor.value=code.slice(0,cursorPos)+"\n"+indentation+"  "+"\n"+indentation+code.slice(cursorPos);
		editor.setSelectionRange(cursorPos+indentation.length+3,cursorPos+indentation.length+3);
	} else {
		editor.value=code.slice(0,cursorPos)+"\n"+indentation+code.slice(cursorPos);
		editor.setSelectionRange(cursorPos+indentation.length+1,cursorPos+indentation.length+1);
	}
	updateCodeDisplay();
}
function handleTab() {
	const cursorPos=editor.selectionStart;
	const code=editor.value;
	editor.value=code.slice(0,cursorPos)+"  "+code.slice(cursorPos);
	editor.setSelectionRange(cursorPos+2,cursorPos+2);
	updateCodeDisplay();
}

function updateCursor() {
	const cursorPos=editor.selectionStart;
	const code=editor.value;
	const linePos=(code.slice(0,cursorPos).match(/\n/g) || []).length;
	const currentLine=code.slice(code.lastIndexOf("\n",cursorPos-1)+1,cursorPos);
	const col=currentLine.length;
	cursorElement.style=`top: ${linePos*1.2}em; left: ${col*0.55+4}em;`;
}

function updateCodeDisplay() {
	const code=editor.value;
	const formatted=highlight(code);
	const newLines=formatted.split("\n");
	codeDisplay.innerHTML=newLines.map(line => `<div class="editor-line">${line}</div>`).join("");
	codeDisplay.appendChild(cursorElement);
}

function highlight(code) {
	return code
		.replace(/&/g,"&amp;")
		.replace(/\</g,"&lt;")
		.replace(/\>/g,"&gt;")
		.replace(/(([+\-*\/%]|&[lg]t;|&amp;)+)([^=]|\n|$)/g,`<op>$1</op>$3`)
		.replace(/(([+\-*\/%|]|&[lg]t;|&amp;)?[=]+)/g,`<eq>$1</eq>`)
		.replace(/("([^\\"]|\\.)*("|$|\n))/g,`<span class="str">$1</span>`)
		.replace(/('([^\\']|\\.)*('|$|\n))/g,`<span class="str">$1</span>`)
		.replace(/<eq>([^\<]*)<\/eq>/g,`<span class="op">$1</span>`)
		.replace(/<op>([^\<]*)<\/op>/g,`<span class="op">$1</span>`)
		.replace(/(-?\b[0-9][0-9_]*(\.[0-9_]*)?)\b/g,`<span class="num">$1</span>`)
		.replace(/\b(for|while|if|else)\b/g,`<span class="kw-1">$1</span>`)
		.replace(/\b(function\s+[A-Za-z_][A-Za-z0-9_]*\s*\(.*,\s*)([A-Za-z_][A-Za-z0-9_]*)\b/g,`$1<span class="arg">$2</span>`)
		.replace(/\b(function\s+[A-Za-z_][A-Za-z0-9_]*\s*\(\s*)([A-Za-z_][A-Za-z0-9_]*)\b/g,`$1<span class="arg">$2</span>`)
		.replace(/\b(function\s+)([A-Za-z_][A-Za-z0-9_]*)(\s*\(|\n|$)/g,`$1<span class="def">$2</span>$3`)
		.replace(/\b(function|var|let|const)\b/g,`<span class="kw-2">$1</span>`)
		.replace(/\b([A-Za-z_][A-Za-z0-9_]*)(\s*\()/g,`<span class="call">$1</span>$2`)
		.replace(/\b([A-Za-z_][A-Za-z0-9_]*)(\s*\.)/g,`<span class="var">$1</span>$2`)
		.replace(/([()\[\]{}])/g,`<span class="bracket">$1</span>`)
		.replace(/([\.,])/g,`<span class="punc">$1</span>`)
		.replace(/\b(NaN|undefined|null|true|false)\b/g,`<span class="var">$1</span>`)
}