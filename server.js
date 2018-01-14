var http = require('http');
var WebSocketServer = require('websocket').server;
var fs = require('fs');
var PORT = 18000;
//Partie pour servir les fichiers statiques (serveur http normal)
var server = http.createServer(function(request, response) {
	var responsePage;
	switch(request.url){
		case '/':
			response.writeHead(200, {'Content-Type': 'text/html'});
			responsePage = fs.readFileSync('client.html');
		break;
		case '/GameManager.js':
			response.writeHead(200, {'Content-Type': 'text/javascript'});
			responsePage = fs.readFileSync('GameManager.js');
		break;
		case '/client.js':
			response.writeHead(200, {'Content-Type': 'text/javascript'});
			responsePage = fs.readFileSync('client.js');
		break;
		//404 Not found
		default:
			response.writeHead(404, {'Content-Type': 'text/html'});
			responsePage = '<html><head><meta charset="utf-8"><title>Oops !</title></head><body>L\'url demandée n\'existe pas.</body>';
		break;
	}
	response.end(responsePage);
});
server.listen(PORT, function() {
	console.log("Server listening on port "+PORT)
});


// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

let i = 0;
let clients = [];

// WebSocket server
wsServer.on('request', function(request) {
    let connection = request.accept(null, request.origin);
    connection.id = i++;
    clients.push(connection);

    connection.on('message', function(message) {
		if(message.type === 'utf8')
			message = JSON.parse(message.utf8Data);
		else
			return;
		if(message.type === 'newplayer'){
			connection.player = message.player;
            clients.forEach(function(client){
                if(client !== connection){
                    let messageOldPlayer = {};
                    messageOldPlayer.type = 'newplayer';
                    messageOldPlayer.player = client.player;
                	connection.send(JSON.stringify(messageOldPlayer));
                    client.send(JSON.stringify(message));
                }
            });
		}else if(message.type === 'newpos'){
			connection.player.pos = message.pos;
            clients.forEach(function(client){
                if(client !== connection){
                    message.id = connection.id > client.id ? connection.id-1 : connection.id;
                    client.send(JSON.stringify(message));
                }
            });
		}else if(message.type === 'message'){
            clients.forEach(function(client){
                if(client !== connection){
                    message.id = connection.id > client.id ? connection.id-1 : connection.id;
                    client.send(JSON.stringify(message));
                }
            });
		}
    });

    connection.on('close', function() {
    	///////////////////
		//CODE TO INSERT HERE
		///////////////////
        let message = {};
        message.type = 'deleteplayer';
        clients.forEach(function(client){
            if(client !== connection) {
                message.id = connection.id > client.id ? connection.id - 1 : connection.id;
                client.send(JSON.stringify(message));
            }
        });
		console.log("close" + connection.id);
		let found = false;
		let index;
		i--;
		clients = clients.filter(function(client, i){
			if(client !== connection){
				if(found){
                    client.id--;
				}
				return true;
			}else{
				found = true;
				index = i;
				return false;
			}
		});
    });
});

