var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var alleSpieler = {};

app.get('/', function (req, res) {
    app.use(express.static(__dirname + '/public'));
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (spieler) {
    
    
            spieler.on('chat message', function (msg) {
                console.log(msg);
                var nachricht = alleSpieler[spieler.id] + ": " + msg;
                io.emit('chat message', nachricht);
            });
    
    
            //Anmeldung
            spieler.on('beitritt', function (name) {
                alleSpieler[spieler.id] = name;
                spieler.emit('beitritt', "Hallo du! Willkommen im Chat");
            } );
});



        http.listen(3000, function () {
            console.log('listening on *:3000');
        });