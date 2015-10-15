var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");

/*
mehrdimensionales Array, erste Dimension sind Spieler, zweite sind Attribute der Spieler
1 = name
2 = zustand (0 = rät, 1 = zeichnet)
weitere beliebig hinzufügen und hier eintragen
*/
var alleSpieler = new Array();

//// Array für das Ratewort
var words = new Array();
var currentWordIndex = 0;
var curZeichnerIndex = 0;

app.get('/', function (req, res) {
    app.use(express.static(__dirname + '/public'));
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (spieler) {

    //Senden von Chatnachrichten
    spieler.on('chat message', function (msg) {
        console.log(msg);
        console.log(spieler.name + " hat eine Nachricht gesendet"); // Test ob Namenvergabe funktioniert
        var curSpieler;
        for (var i = 0; i < alleSpieler.length; i++) {
            if (alleSpieler[i].id == spieler.id) {
                curSpieler = i;
                var nachricht = alleSpieler[i].name + ": " + msg;
                io.emit('chat message', nachricht);
                break;
            }
        }
        chkGuess(msg, curSpieler);
    });


    //Anmeldung
    spieler.on('beitritt', function (name) {
        spieler.name = name;
        spieler.points = 0; ////Punkte für das richtige Erraten
        if (alleSpieler.length == 0) {
            spieler.zustand = 1;
        } else {
            spieler.zustand = 0;
        }
        alleSpieler.push(spieler);
        //console.log(spieler.id);
        // Anzeigen der Spieler in Spielerliste
        spielerListeakt();


        spieler.emit('beitritt', "Hallo du! Willkommen im Chat");
        showSpielstatus(); //// zeigt dem, der dran ist, das zu zeichnende Wort an
    });

    spieler.on('zeichnung', function (vonX, vonY, nachX, nachY) {
        spieler.broadcast.emit('malen', vonX, vonY, nachX, nachY);
    });

    //Spieler verlässt das Spiel
    spieler.on('verlassen', function () {
        for (var i = 0; i < alleSpieler.length; i++) {
            if (alleSpieler[i].id = spieler.id) {
                alleSpieler.slice(i)
                nachricht = alleSpieler[i].name + ' hat das Spiel verlassen';
                io.emit('chat message', nachricht);
                break;
            }
        }

    });
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});

readArray("Begriffe.txt");
currentWordIndex = randIndex();


// Datei mit Begriffen wird eingelesen
function readArray(dateiname) {
    words = fs.readFileSync(dateiname).toString('utf-8').split("\r\n");
}


// Zufälliges Wort wird ausgewählt
function randIndex() {
    rIndex = Math.floor(Math.random() * words.length);
    return rIndex;
}


//	function showSpielerstatus: zeigt nur dem Zeichnenden das Wort an
function showSpielstatus() {
    for (var i = 0; i < alleSpieler.length; i++) {
        if (alleSpieler[i].zustand == 1 && alleSpieler.length > 1) {
            io.sockets.connected[alleSpieler[curZeichnerIndex].id].emit('raten', "Zeichne den Begriff: " + words[currentWordIndex]);
        } else if (alleSpieler[i].zustand == 1 && alleSpieler.length == 1) {
            io.sockets.connected[alleSpieler[curZeichnerIndex].id].emit('raten', "Warte auf weitere Mitspieler. ")
        } else if (alleSpieler[i].zustand == 0 && alleSpieler.length > 1) {

            io.sockets.connected[alleSpieler[i].id].emit('raten', "Du rätst ");
        }

    }
}


//		Funktion chkGuess vergleicht Chat-Messages mit dem zu erratenden Begriff; der User, der es erraten hat, malt als nächstes 

function chkGuess(guess, idx) {
    if (guess.toUpperCase() === words[currentWordIndex].toUpperCase() && curZeichnerIndex != idx) {
        var nachricht = "Spieler " + alleSpieler[idx].name + " hat den Begriff " + words[currentWordIndex] + " erraten.";
        io.emit('chat message', nachricht);
        alleSpieler[idx].points++; ////Gewinnpunkt wird zugefügt
        currentWordIndex = randIndex();
        alleSpieler[curZeichnerIndex].zustand = 0;
        alleSpieler[idx].zustand = 1;
        curZeichnerIndex = idx;

        showSpielstatus();
        
        spielerListeakt();

    }

}
function spielerListeakt() {
    var spielerArray = new Array(); 
    
    for (var i = 0; i < alleSpieler.length; i++) {
        
    var temp = '' + alleSpieler[i].name + '   ' + alleSpieler[i].points;
    spielerArray.push(temp);
        
    } io.sockets.emit ('listenaktualisierung', spielerArray);
}