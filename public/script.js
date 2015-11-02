//alles außer login ausblenden
document.getElementById("header").style.display = 'none';
document.getElementById("alle").style.display = 'none';

//Gibt an, ob der Spieler Maler ist oder nicht
var maler = false;
var leinwand = document.getElementById("leinwand");
var clearButton = document.getElementById ("farbklecks");
var paint = false;

var socket = io();
initLeinwand();


//Anmeldelogik
var loginbutton = document.getElementById("loginbutton");
var usrname = document.getElementById("logineingabefeld");
loginbutton.onclick = function () {
    socket.emit('beitritt', usrname.value);
};
//Setzt den Fokus in das Eingabefeld für den Benutzernamen
usrname.focus();

//Login mit Enter ermöglichen
usrname.onkeypress = function (key) {
    if (key.which == 13) {
        loginbutton.onclick();
    }
};

//Chat Logik
var sendebutton = document.getElementById("chatsendebutton");
var text = document.getElementById("chateingabefeld");
    //Sendet die Chatnachricht an die anderen Mitspieler
sendebutton.onclick = function () { 
    if(text.value){
        socket.emit('chat message', text.value);
    }
    text.value = '';
};

    //Senden mit Enter
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
    var sekunde = uhrzeit.getSeconds();
        //Formatierung der Zeit
    if (minute<10){
        minute = '0' + minute;}
    
    var zeit = '[' + stunde + ':' + minute + ':' + sekunde + '] ';
    
        //Nachricht zusammensetzen
    if(name){
        msg.innerHTML = zeit + '<b>' + name + ': </b>' + nachricht;
    }else{
        msg.innerHTML = zeit + '<b>' + nachricht + '</b>';
    }
        //Nachricht dem Chat hinzufügen
    child.appendChild(msg);
    liste.appendChild(child);
    
    // Zum Ende der Chat-Liste scrollen
    liste.scrollTop = liste.scrollHeight;
});

/*
Beitrittsfunktion:
    @check: sollte ein boolean sein, bei dem der Server Rückschluss darauf gibt, ob der Benutzername bereits vergeben wurde oder nicht
*/
socket.on('beitritt', function (check) {
    if(check){
        //ausblenden des Logins und einblenden des Contents
        document.getElementById("header").style.display = "block";
        document.getElementById("alle").style.display = "flex";
        document.getElementById("loginrahmen").style.display = "none";
        var liste = document.getElementById("messages");
        var child = document.createElement("li");
        child.appendChild(document.createTextNode("Hallo du! Willkommen bei Guess What!"));

        liste.appendChild(child);
        
        initLeinwand();
        //initiale Maleinstellung
        var farbe = "black";
        context.lineWidth = 3;
        document.getElementById("chateingabefeld").focus();
    }else{
        // Warnung das Nutzername vergeben ist
        window.alert("Der Benutzername ist bereits in Verwendung!");
    }
});

/*
Reinigen der Leinwand:
    Die bisherige Linie wird beendet damit clearRect() funktioniert
*/
socket.on('reinigen', function () {
    context.closePath();
    context.beginPath();
    context.clearRect(0, 0, leinwand.width, leinwand.height);
});

/*
Funktion der Leinwandreinigung auf den clearButton legen
*/
clearButton.onclick = function () { 
 if(maler == true ) 
	 socket.emit('leinwandReinigen')};

/*
onBeforeUnload:
    Client sendet dem Server das Signal, dass er das Spiel verlässt
*/
window.onbeforeunload = function () {
    socket.emit('verlassen');
}

/*
Ratelogik:
    @msg enthält den Inhalt, der dem Client im Statusfenster angezeigt wird
    @malzustand setzt den malzustand des Clients
*/
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

/*
Listenaktualisierung:
    @spielerArray enthält die Daten der aktuellen Spieler
*/
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
// zum initialisieren des Malbereichs
leinwand = document.getElementById('leinwand');
context = leinwand.getContext("2d");


leinwand.addEventListener("mousedown", malbeginn, false);
leinwand.addEventListener("mousemove", sendemalen, false);
leinwand.addEventListener("mouseup", malende, false);
leinwand.addEventListener("mouseleave", malende, false);

var vorherigeClicks = {};
var clickDrag = new Array();

/*
malbeginn:
    Wird bei mousedown ausgeführt. Die Position beim Klick wird dokumentiert
*/
function malbeginn(e) {
    e.preventDefault();
    if(maler){
    vorherigeClicks.mouseX = (e.pageX - leinwand.offsetLeft)/leinwand.width;
    vorherigeClicks.mouseY = (e.pageY - leinwand.offsetTop)/leinwand.height;

    paint = true;
    }
}

/*
sendemalen:
    Wird bei Bewegung der Maus ausgeführt
    Funktion nur als Maler
        sendet die Aktion an den Server und lässt auf Clientseite zeichnen 
*/
function sendemalen(e) {
    if(maler){
    if (paint) {
        neuX = (e.pageX - leinwand.offsetLeft)/leinwand.width;
        neuY = (e.pageY - leinwand.offsetTop)/leinwand.height;
        socket.emit('zeichnung', vorherigeClicks.mouseX, vorherigeClicks.mouseY, neuX, neuY);
        malen(vorherigeClicks.mouseX, vorherigeClicks.mouseY, neuX, neuY);
        vorherigeClicks.mouseX = neuX;
        vorherigeClicks.mouseY = neuY;
    }
    }
}

/*
malende:
    Wird bei mouseup ausgeführt und sobald der mauszeiger die Leinwand verlässt
    Beendet den Malvorgang
*/
function malende(e) {
    if(maler)
    paint = false;
}



/*
farbuebergabe
    Wird beim Klicken auf einer der Farbbuttons ausgeführt
    Wählt die angeklickte Farbe aus und sendet an den Server die Änderung
    Ändert beim Radiergummi die Dicke auf 15px und bei anderen auf 3px
*/
function farbuebergabe (buttonnr){
    if(maler){
        var element = document.getElementById(buttonnr);
        var cssdaten = window.getComputedStyle(element, null);
        farbe = cssdaten.backgroundColor;
    context.closePath();
    context.beginPath();
        if(buttonnr == "radierer"){
            context.lineWidth = 15;
            farbe = "white";
            socket.emit('farbe_setzen', farbe, 15);
        }else{
            context.lineWidth = 3;
            socket.emit('farbe_setzen', farbe, 3);
        }
            
    }
}

/*
farbe_setzen:
    Ändert auf die übergebene Farbe und Breite    
*/
socket.on('farbe_setzen', function(neueFarbe, neueBreite){
    context.closePath();
    context.beginPath();
    farbe = neueFarbe;
    context.lineWidth = neueBreite;
});

/*
malen
    @vonX x-lage der vorherigen mausposition
    @vonY y-lage der vorherigen mausposition
    @nachX x-lage der neuen mausposition
    @nachY y-lage der neuen mausposition
    
    die Lagen sind in Relation zur Höhe und Breite übergeben
    Zieht einen Strich innerhalb der Leinwand von der vorherigen Mausposition zur neuen
*/
function malen(vonX, vonY, nachX, nachY) {    
    context.strokeStyle = farbe;
    context.lineJoin = "round";
    context.moveTo((vonX * leinwand.width), (vonY * leinwand.height));
    context.lineTo((nachX * leinwand.width), (nachY * leinwand.height));
    context.stroke();
}

/*
socket.on(malen):
    führt die Funktion malen() aus mit den vom Server gesendeten Werten
*/
socket.on('malen', function (vonX, vonY, nachX, nachY) {
    malen(vonX, vonY, nachX, nachY);
});

//anpassen der Leinwand bei Größenänderung des Fensters
window.onresize = initLeinwand;



/*
initLeinwand:
    Buffert die Leinwand im Canvas Buffer, passt die Leinwandgröße an
    und stellt das Bild wieder her. Anschließend wird der Buffer auf 0x0px verkleinert
*/
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