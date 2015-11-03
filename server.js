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
var timerFired = false; // startTimer nur einmal pro Runde
var countdown = 90; //Countdownzeit in Sekunden

app.get('/', function (req, res) {
    app.use(express.static(__dirname + '/public'));
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (spieler) {

    //Senden von Chatnachrichten
    spieler.on('chat message', function (msg) {
        console.log(spieler.name + " hat eine Nachricht gesendet:"); // Test ob Namenvergabe funktioniert
        console.log(msg);
        var curSpieler;
        for (var i = 0; i < alleSpieler.length; i++) {
            if (alleSpieler[i].id == spieler.id) {
                curSpieler = i;
                //var nachricht = alleSpieler[i].name + ": " + msg;
                
                io.emit('chat message', msg, alleSpieler[i].name);
                break;
            }
        }
        chkGuess(msg, curSpieler);
    });


    //Anmeldung
    spieler.on('beitritt', function (name) {
        var check = prüfeNamen(name);
        if(check){
            spieler.name = name;
            spieler.points = 0; ////Punkte für das richtige Erraten
            if (alleSpieler.length == 0) {
                spieler.zustand = 1;
            } else {
                spieler.zustand = 0;
            }
            alleSpieler.push(spieler);

            // Anzeigen der Spieler in Spielerliste
            spielerListeakt();
        }


        spieler.emit('beitritt', check);
        showSpielstatus(); //// zeigt dem, der dran ist, das zu zeichnende Wort an
    });

    spieler.on('zeichnung', function (vonX, vonY, nachX, nachY) {
        spieler.broadcast.emit('malen', vonX, vonY, nachX, nachY);
    });

    //Spieler verlässt das Spiel
       spieler.on('verlassen', function () {
         var removeID;
         for (var i = 0; i < alleSpieler.length; i++) {
           if (alleSpieler[i].id == spieler.id) {
                removeID = i;
                nachricht = alleSpieler[i].name + ' hat das Spiel verlassen';
                io.emit('chat message', nachricht);}
            }
            if(alleSpieler.length > 1){
                if (alleSpieler[removeID].zustand == 1 && removeID == 0){ //der Zeichner verlässt das Spiel
                    alleSpieler[removeID+1].zustand = 1; //wenn Zeichner der 1. im Array war,  wird der nächste Spieler im Array Zeichner
					stopTimer(); // bewirkt Neustart des Timers beim Wechsel des Zeichners
                 }
               if (alleSpieler[removeID].zustand == 1 && removeID > 0) {
                    alleSpieler[removeID-1].zustand =1; // ansonsten wird der Spieler davor Zeichner
					stopTimer(); // bewirkt Neustart des Timers beim Wechsel des Zeichners
                }                          
                alleSpieler.splice(removeID,1); // Bei mindestens 2 Usern
				spielerListeakt();
            for (j = 0; j < alleSpieler.length; j++){ //Update current Zeichnerindex für showSpielstatus()
                if (alleSpieler[j].zustand == 1) {
					curZeichnerIndex = j;
                }
            }
            showSpielstatus();
            }
            else{ //ist nur noch ein Spieler im Spiel
            stopTimer();
            alleSpieler.splice(removeID,1);} 
            curZeichnerIndex = 0; // init current Zeichnerindex
 	});
    
    // Reinigen der Leinwand, wenn Button geklickt wird
    spieler.on('leinwandReinigen', function () {
        io.emit('reinigen');
    });
    
    spieler.on('farbe_setzen', function(farbe, breite){
        spieler.broadcast.emit('farbe_setzen', farbe, breite);   
    });
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});

readArray("Begriffe.txt");
currentWordIndex = randIndex();


// Datei mit Begriffen wird eingelesen
function readArray(dateiname) {
    words = fs.readFileSync(dateiname).toString('utf-8').split(/[?:\r|\n]+/);
}


// Zufälliges Wort wird ausgewählt
function randIndex() {
    rIndex = Math.floor(Math.random() * words.length);
    return rIndex;
}


//	function showSpielstatus: zeigt nur dem Zeichnenden das Wort an
function showSpielstatus() {
        for (var i = 0; i < alleSpieler.length; i++) {
            if (alleSpieler[i].zustand == 1 && alleSpieler.length > 1) {
                io.sockets.connected[alleSpieler[curZeichnerIndex].id].emit('raten', "Zeichne den Begriff: " + words[currentWordIndex], true);
            if (timerFired == false) {
				startTimer();			// Der Timer wird gestartet 
                timerFired = true;
                };  
			} else if (alleSpieler[i].zustand == 1 && alleSpieler.length == 1) {
                io.sockets.connected[alleSpieler[curZeichnerIndex].id].emit('raten', "Warte auf weitere Mitspieler. ")
            } else if (alleSpieler[i].zustand == 0 && alleSpieler.length > 1) {
                io.sockets.connected[alleSpieler[i].id].emit('raten', "Du rätst ", false);
            }

        } 
}


//		Funktion chkGuess vergleicht Chat-Messages mit dem zu erratenden Begriff; der User, der es erraten hat, malt als nächstes 

function chkGuess(guess, idx) {
    if (guess.toUpperCase() === words[currentWordIndex].toUpperCase() && curZeichnerIndex != idx) {
        var nachricht = "Spieler " + alleSpieler[idx].name + " hat den Begriff " + words[currentWordIndex] + " erraten.";
        io.emit('chat message', nachricht);
		stopTimer();
        alleSpieler[idx].points++; ////Gewinnpunkt wird zugefügt
        if (alleSpieler.length > 2) {
            alleSpieler[curZeichnerIndex].points++;
        }; //der gute Zeichner kriegt auch einen Punkt, wenn mehr als zwei Spieler spielen
        currentWordIndex = randIndex();
        alleSpieler[curZeichnerIndex].zustand = 0;
        alleSpieler[idx].zustand = 1;
        curZeichnerIndex = idx;

        showSpielstatus();

        spielerListeakt();
        io.emit('reinigen'); //den Clients die Anweisung geben die Leinwand zu clearen

    }

}

function prüfeNamen(name)
{
    for (var i=0; i < alleSpieler.length; i++)
        {
            if(alleSpieler[i].name == name)
                {
                    console.log("Dieser Name wird bereits verwendet.");
                    return false;
                }
        }
    return true; //name wurde nicht gefunden
}



function spielerListeakt() {
    var spielerArray = new Array();

    for (var i = 0; i < alleSpieler.length; i++) {

        var temp = {
            name: alleSpieler[i].name,
            points: alleSpieler[i].points
        }
        spielerArray.push(temp);
    }
    spielerArray.sort(sortierfunktion);
    io.sockets.emit('listenaktualisierung', spielerArray);
}

function sortierfunktion(a, b) {
    if (a.points < b.points) {
        return 1;
    }
    if (a.points > b.points) {
        return -11;
    }
    return 0;
};

// Timerfunktion, die die Spielzeit je Runde auf 90 Sekunden beschränkt
function startTimer(){
	var count = countdown;  
	timerFired= true;
	
    timID=setInterval(function() {  
        io.emit('updateTimer', count)
        //console.log("Sek " + count);
        count--;
        if (count == 0){
            stopTimer();
           // console.log("Stop");
            newRound(); 
        }
    }, 1000);
}

//Stoppt den Timer
function stopTimer(){
	try {
		clearInterval(timID);
		timerFired = false;
		io.emit('updateTimer', " ")
	} 
	catch (e) {
        console.log("Info: No timer was running");
    }   
};


// Startet eine neue Runde
 function newRound(){
    var nachricht = "Der Begriff "  + words[currentWordIndex] + " wurde nicht erraten.";
        io.emit('chat message', nachricht);  
    var nachricht = "Neue Runde!";
        io.emit('chat message', nachricht);  
        currentWordIndex = randIndex(); //ein neues Wort wird zufällig ausgesucht
        curZeichnerIndex = (curZeichnerIndex + 1) % alleSpieler.length; //wurde das Wort nicht erraten, ist der nächste Spieler mit malen dran
        for (var i = 0; i < alleSpieler.length; i++) {
            alleSpieler[i].zustand = 0;
        }
        alleSpieler[curZeichnerIndex].zustand = 1;  // neuer Zeichner wird bestimmt
        showSpielstatus();
        spielerListeakt();
        io.emit('reinigen'); //den Clients die Anweisung geben die Leinwand zu clearen

};