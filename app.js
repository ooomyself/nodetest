var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({ port: 3000 });
console.log("Server on port 3000");
wss.on('connection', function (ws) {
    console.log('client connected');
    ws.send("hello ws");
    ws.on('message', function (message) {
        console.log(message);
    });
});