var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*
mehrdimensionales Array, erste Dimension sind Spieler, zweite sind Attribute der Spieler
1 = name
2 = zustand (0 = rät, 1 = zeichnet)
weitere beliebig hinzufügen und hier eintragen
*/
var alleSpieler = new Array();

app.get('/', function (req, res) {
    app.use(express.static(__dirname + '/public'));
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (spieler) {

    //BREAK nach gefunden fehlt
    spieler.on('chat message', function (msg) {
        console.log(msg);
        for (var i = 0; i < alleSpieler.length; i++) {
            if (alleSpieler[i].id == spieler.id)
                var nachricht = alleSpieler[i].name + ": " + msg;
            io.emit('chat message', nachricht);
        }


    });


    //Anmeldung
    spieler.on('beitritt', function (name) {
        spieler.name = name;
        alleSpieler.push(spieler);
        console.log(spieler.id);
        spieler.emit('beitritt', "Hallo du! Willkommen im Chat");
    });
});



http.listen(3000, function () {
    console.log('listening on *:3000');
});