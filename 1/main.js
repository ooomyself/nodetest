var http = require('http');
http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    // 发送响应数据 "Hello World"
    response.end('Hello World \n');

    console.log("访问时间"+Date.now());
}).listen(3000, '0.0.0.0'); // 0.0.0.0 可以在局域网内通过本机IP访问