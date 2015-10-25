//chat ausblenden
document.getElementById("chat").style.visibility = 'hidden';
//Ratebereich ausbleben
document.getElementById('rateboard').style.visibility = 'hidden';
// Spielerliste ausblenden
document.getElementById('malerlistenbereich').style.visibility = 'hidden';
//Malbereich ausbleben
document.getElementById('malbereich').style.visibility = 'hidden';
//Farbpalette ausblenden
document.getElementById('farben').style.visibility = 'hidden';

var socket = io();
initLeinwand();

//Anmeldelogik
var loginbutton = document.getElementById("usrlogin");
var usrname = document.getElementById("usr");
loginbutton.onclick = function () {
    socket.emit('beitritt', usrname.value);
}
usrname.focus();
usrname.onkeypress = function (key) {
    if (key.which == 13) {
        loginbutton.onclick();
    }
};


//Chat Logik
var sendebutton = document.getElementById("sendebutton");
var text = document.getElementById("m");
sendebutton.onclick = function () {
    socket.emit('chat message', text.value);
    text.value = '';
}
text.onkeypress = function (key) {
    if (key.which == 13) {
        sendebutton.onclick();
    }
}

socket.on('chat message', function (msg) {
    var liste = document.getElementById("messages");
    var child = document.createElement("li");
    child.appendChild(document.createTextNode(msg));
    liste.appendChild(child);
    // Zum Ende der Chat-Liste scrollen
    liste.scrollTop = liste.scrollHeight;
});


socket.on('beitritt', function (msg) {
    document.getElementById("chat").style.visibility = "visible";
    document.getElementById("malbereich").style.visibility = "visible";
    document.getElementById("rateboard").style.visibility = "visible";
    document.getElementById("malerlistenbereich").style.visibility = 'visible';
    document.getElementById('farben').style.visibility = 'visible';
    document.getElementById("loginrahmen").style.visibility = "hidden";
    var liste = document.getElementById("messages");
    var child = document.createElement("li");
    child.appendChild(document.createTextNode(msg));

    liste.appendChild(child);
});

// Reinigen der Leinwand
socket.on('reinigen', function () {
    var leinwand = document.getElementById("leinwand");
    context.closePath();
    context.beginPath();
    context.clearRect(0, 0, leinwand.width, leinwand.height);
});
// Leinwand reinigen nach Click
var clearButton1 = document.getElementById ("clearButton");
clearButton1.onclick = function () { socket.emit('leinwandReinigen')};


//Spieler schließt den Tab
window.onbeforeunload = function () {
    socket.emit('verlassen');
}


//Das zu erratende Wort wird angezeigt
socket.on('raten', function (msg) {
    document.getElementById("rateboard").innerHTML = (msg);

});
// Chat Logik Ende


// Liste der Spieler
socket.on('listenaktualisierung', function (spielerArray) {
    var liste = document.getElementById("malerliste");
    // leeren der Liste
    while (liste.firstChild) {
        liste.removeChild(liste.firstChild);
    }
    for (var i = 0; i < spielerArray.length; i++) {
        var child = document.createElement("li");
        child.appendChild(document.createTextNode(spielerArray[i].name + '            '  + spielerArray[i].points));
        liste.appendChild(child);
    }
});

/*
 *    Logik des Malbereiches
 */

var paint = false;


// zum initialisieren des Malbereichs
leinwand = document.getElementById('leinwand');
context = leinwand.getContext("2d");


leinwand.addEventListener("mousedown", malbeginn, false);
leinwand.addEventListener("mousemove", sendemalen, false);
leinwand.addEventListener("mouseup", malende, false);
leinwand.addEventListener("mouseleave", ausBildschirm, false);

var vorherigeClicks = {};
var clickDrag = new Array();

function malbeginn(e) {
    e.preventDefault();
    vorherigeClicks.mouseX = e.pageX - leinwand.offsetLeft;
    vorherigeClicks.mouseY = e.pageY - leinwand.offsetTop;

    paint = true;
}

function sendemalen(e) {

    if (paint) {
        neuX = e.pageX - leinwand.offsetLeft;
        neuY = e.pageY - leinwand.offsetTop;
        socket.emit('zeichnung', vorherigeClicks.mouseX, vorherigeClicks.mouseY, neuX, neuY);
        malen(vorherigeClicks.mouseX, vorherigeClicks.mouseY, neuX, neuY);
        vorherigeClicks.mouseX = neuX;
        vorherigeClicks.mouseY = neuY;
    }

}

function malende(e) {
    paint = false;

}

function ausBildschirm(e) {
    paint = false;
}

var farbe = "black";

function farbuebergabe (buttonnr){
        var element = document.getElementById(buttonnr);
        var cssdaten = window.getComputedStyle(element, null);
        farbe = cssdaten.backgroundColor;
}


function malen(vonX, vonY, nachX, nachY) {
    /*var farbe = document.getElementsByClassName('farbbutton').addEventListener;*/
    
    context.strokeStyle = farbe;
    context.lineJoin = "round";
    context.lineWidth = 5;
    context.moveTo(vonX, vonY);
    context.lineTo(nachX, nachY);
    context.stroke();
}

socket.on('malen', function (vonX, vonY, nachX, nachY) {
    malen(vonX, vonY, nachX, nachY);
});

window.onresize = initLeinwand();

function initLeinwand() {
    var buffer = document.getElementById('buffer');
    var w = document.getElementById("malbereich").clientWidth;
    var h = document.getElementById("malbereich").clientHeight;
    buffer.width = w;
    buffer.height = h;
    buffer.getContext('2d').drawImage(leinwand, 0, 0);
    leinwand.width = w;
    leinwand.height = h;
    leinwand.getContext('2d').drawImage(buffer, 0, 0);
}