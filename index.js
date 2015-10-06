var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var alleSpieler = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (spieler) {
    
    
            spieler.on('chat message', function (msg) {
                console.log(msg);
                var nachricht = alleSpieler[spieler.id]
                io.emit('chat message', msg);
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