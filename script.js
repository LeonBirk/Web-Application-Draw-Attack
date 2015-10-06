//chat ausblenden
        document.getElementById("chat").style.visibility = 'hidden';
        
        
        var socket = io();
        //Anmeldelogik
        document.getElementById("usrlogin").onclick = function () {
            var usrname = document.getElementById("usr");
            socket.emit('beitritt', usrname.value);
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
        }); 
        
        
        socket.on('beitritt', function(msg){
         document.getElementById("chat").style.visibility = "visible";
            document.getElementById("login").style.visibility = "hidden";
            var liste = document.getElementById("messages");
            var child = document.createElement("li");
            child.appendChild(document.createTextNode(msg));

            liste.appendChild(child);
        });
        
        // Chat Logik Ende