//alles außer login ausblenden
document.getElementById("header").style.display = 'none';
document.getElementById("alle").style.display = 'none';

//Gibt an, ob der Spieler Maler ist oder nicht
var maler = false; 

var socket = io();
initLeinwand();


//Anmeldelogik
var loginbutton = document.getElementById("loginbutton");
var usrname = document.getElementById("logineingabefeld");
loginbutton.onclick = function () {
    socket.emit('beitritt', usrname.value);
};
//Eingabe ohne vorher ins Feld zu klicken
usrname.focus();
//wenn in Eingabefeld Login mit Enter
usrname.onkeypress = function (key) {
    if (key.which == 13) {
        loginbutton.onclick();
    }
};

//Chat Logik
var sendebutton = document.getElementById("chatsendebutton");
var text = document.getElementById("chateingabefeld");
sendebutton.onclick = function () {
    if(text.value){
        socket.emit('chat message', text.value);
    }
    text.value = '';
};
//Eingabe ohne vorher ins Feld zu klicken
text.focus();
//wenn in Eingabefeld Senden mit Enter
text.onkeypress = function (key) {
    if (key.which == 13) {
        sendebutton.onclick();
    }
};

// Ausgabe der Chat-Nachricht
socket.on('chat message', function (nachricht, name) {
var liste = document.getElementById("messages");
    var child = document.createElement("li");
    var msg = document.createElement("span");
    
    // Aktuelle Zeit der Nachricht hinzufügen format: [00:00:00]
    var uhrzeit = new Date();
    var stunde = uhrzeit.getHours();
    var minute = uhrzeit.getMinutes();
    if (minute<10){
        minute = '0' + minute;}
    else{}
    var sekunde = uhrzeit.getSeconds();
    if (sekunde<10){
        sekunde = '0' + minute;}
    else{}
    var zeit = '[' + stunde + ':' + minute + ':' + sekunde + '] ';
    
    //Nachricht zusammensetzen
    if(name){
        msg.innerHTML = zeit + '<b>' + name + ': </b>' + nachricht;
    }else{
        msg.innerHTML = zeit + '<b>' + nachricht + '</b>';
    }
    child.appendChild(msg);
    liste.appendChild(child);
    
    // Zum Ende der Chat-Liste scrollen
    liste.scrollTop = liste.scrollHeight;
});

//überprüfung ob Nutzername bereits vergeben ist und wenn nicht: anzeigen der Webseite 
socket.on('beitritt', function (check) {
    if(check){
        document.getElementById("header").style.display = "block";
        document.getElementById("alle").style.display = "flex";
        document.getElementById("loginrahmen").style.display = "none";
        var liste = document.getElementById("messages");
        var child = document.createElement("li");
        child.appendChild(document.createTextNode("Hallo du! Willkommen bei der krassesten WebApp auf Erden :)"));

        liste.appendChild(child);
        initLeinwand();
        //initiale Maleinstellung
        var farbe = "black";
        context.lineWidth = 3;
    }else{
        // Warnung das Nutzername vergeben ist
        window.alert("Der Benutzername ist bereits in Verwendung!");
    }
});

// Reinigen der Leinwand
socket.on('reinigen', function () {
    var leinwand = document.getElementById("leinwand");
    context.closePath();
    context.beginPath();
    context.clearRect(0, 0, leinwand.width, leinwand.height);
});

// Leinwand reinigen nach Click
var clearButton = document.getElementById ("farbklecks");
clearButton.onclick = function () { 
 if(maler == true ) 
	 socket.emit('leinwandReinigen')};

//Spieler schließt den Tab
window.onbeforeunload = function () {
    socket.emit('verlassen');
}

//Das zu erratende Wort wird angezeigt
socket.on('raten', function (msg, malzustand) {
            document.getElementById("status").innerHTML = (msg);
            if (malzustand == true) {
                document.getElementById("farbklecks").src = "farbklecksemitschrift.png";
				document.getElementById("farbe").style.visibility = 'visible';
            } else {
                document.getElementById("farbklecks").src="farbkleckse.png";
				document.getElementById("farbe").style.visibility = 'hidden';
            }
            maler = malzustand;
});

// Liste der Spieler
socket.on('listenaktualisierung', function (spielerArray) {
    var liste = document.getElementById("malerliste");
    // leeren der Liste
    while (liste.firstChild) {
        liste.removeChild(liste.firstChild);
    }
    for (var i = 0; i < spielerArray.length; i++) {
        var child = document.createElement("li");
        child.appendChild(document.createTextNode(spielerArray[i].name));
        liste.appendChild(child);
    }
    var liste2 = document.getElementById("punkteliste");
    // Liste leeren
    while (liste2.firstChild) {
        liste2.removeChild(liste2.firstChild);
    }
    for (var i = 0; i < spielerArray.length; i++) {
        var child2 = document.createElement("li");
        child2.appendChild(document.createTextNode(spielerArray[i].points));
        liste2.appendChild(child2);
    }
});

//Logik Timer
socket.on('updateTimer', function (timVal){
		document.getElementById("fuellung").style.width = (timVal*100/90) + "%";
		document.getElementById("prozent").innerHTML = timVal;
})

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
    if(maler){
    vorherigeClicks.mouseX = e.pageX - leinwand.offsetLeft;
    vorherigeClicks.mouseY = e.pageY - leinwand.offsetTop;

    paint = true;
    }
}

function sendemalen(e) {
    if(maler){
    if (paint) {
        neuX = e.pageX - leinwand.offsetLeft;
        neuY = e.pageY - leinwand.offsetTop;
        socket.emit('zeichnung', vorherigeClicks.mouseX, vorherigeClicks.mouseY, neuX, neuY);
        malen(vorherigeClicks.mouseX, vorherigeClicks.mouseY, neuX, neuY);
        vorherigeClicks.mouseX = neuX;
        vorherigeClicks.mouseY = neuY;
    }
    }
}

// Logik damit nur der Maler malen kann
function malende(e) {
    if(maler)
    paint = false;
}

function ausBildschirm(e) {
    if(maler)
    paint = false;
}


//Logik um mit verschiedenen Farben zu malen
function farbuebergabe (buttonnr){
    if(maler){
        var element = document.getElementById(buttonnr);
        var cssdaten = window.getComputedStyle(element, null);
        farbe = cssdaten.backgroundColor;
    context.closePath();
    context.beginPath();
        if(buttonnr == "radierer"){
            context.lineWidth = 15;
        socket.emit('farbe_setzen', farbe, 15);
        }else{
            context.lineWidth = 3;
        socket.emit('farbe_setzen', farbe, 3);
        }
            
    }
}

socket.on('farbe_setzen', function(neueFarbe, neueBreite){
    context.closePath();
    context.beginPath();
    farbe = neueFarbe;
    context.lineWidth = neueBreite;
});

// Mallogik
function malen(vonX, vonY, nachX, nachY) {    
    context.strokeStyle = farbe;
    context.lineJoin = "round";
    context.moveTo(vonX, vonY);
    context.lineTo(nachX, nachY);
    context.stroke();
}

// Übergabe der Zeichnung von Server an Ratende
socket.on('malen', function (vonX, vonY, nachX, nachY) {
    malen(vonX, vonY, nachX, nachY);
});

window.onresize = initLeinwand;

function initLeinwand() {
    //Canvas Buffern
    var buffer = document.getElementById('buffer');
    var w = document.getElementById("leinwand").clientWidth;
    var h = document.getElementById("leinwand").clientHeight;
    buffer.width = w;
    buffer.height = h;
    buffer.getContext('2d').drawImage(leinwand, 0, 0);
    
    //leinwand wiederherstellen und größe der Leinwand an fenster größe anpasssen
    w = document.getElementById("leinwand").clientWidth;
    h = document.getElementById("leinwand").clientHeight;
    leinwand.width = w;
    leinwand.height = h;
    leinwand.getContext('2d').drawImage(buffer, 0, 0);
    var bufctx = buffer.getContext("2d");
    bufctx.closePath();
    bufctx.beginPath();
    bufctx.clearRect(0, 0, leinwand.width, leinwand.height);
	
	buffer.width = 0;
	buffer.height = 0;
}