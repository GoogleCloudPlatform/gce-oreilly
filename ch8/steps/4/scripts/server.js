
function route(app, regex, prefix) {
    app.get(regex, function (req, res) {
        var type = req.params[0];
        var path = req.params[1];
        var file = prefix + type + '/' + path
        res.sendfile(file);
    });
}

var PERFUSE = (function() {
    // Initialize some private variables. 
    var os = require('os');
    var express = require('express');
 
    // Return object encapsulating public variables.
    return {
        // Initialize some public constants. 
        MASTER: 'perfuse-master', // Master's hostname
        WEB_PORT: '80',           // Port num to use for web content 
        WS_PORT: '8080',          // Port num to use for websockets
        REQ_PORT: '3000',         // Port num to use for pub requests 
        RES_PORT: '3001',         // Port num to use for pull responses
    
        // Initialize some public variables. 
        app: express(),
        zmq: require('zmq'),
        hostname: os.hostname(),
        web_sock_server: require('ws').Server,
        web_sock: null
        }
}());
    
if (PERFUSE.hostname == PERFUSE.MASTER) {
    console.log('Master running');
 
    // Serve main page.
    PERFUSE.app.get('/', function(req, res){
        res.sendfile('/src/index.html');
    });
 
    // Serve js, css, and image files.
    route(PERFUSE.app, /^\/(scripts)\/(.*)/, '/src/');
    route(PERFUSE.app, /^\/(styles|styleguide|images|fonts)\/(.*)/, '/wsk/');
 
    // Start web server listening.
    PERFUSE.app.listen(PERFUSE.WEB_PORT);
    console.log('Listening on port ' + PERFUSE.WEB_PORT);
 
    // Init ZeroMQ pub socket for fanning out requests, and
    // pull socket for receiving point-to-point responses.
    var sock_send = PERFUSE.zmq.socket('pub');
    sock_send.bindSync('tcp://*:' + PERFUSE.REQ_PORT);
    var sock_recv = PERFUSE.zmq.socket('pull');
    sock_recv.bindSync('tcp://*:' + PERFUSE.RES_PORT);
 
    // Define behavior for handling test responses.
    sock_recv.on('message', function(msg) {
        try {
            var ev = JSON.parse(msg);
            if (ev.type == 'perf') {
                console.log('event received from slave: ' + msg);
                // We received a perf test response from a slave. If we 
                // have a websockets connection, forward the result to 
                // the client so that it can be presented to the user.
                if (PERFUSE.web_sock) {
                    try {
                        PERFUSE.web_sock.send(msg.toString());
                    } catch(e) {
                        console.log("error " + e);
                    }  
                }
            } else {
                console.log('unknown event received from slave: ' + msg);
            }
        } catch(e) {
            console.log("error " + e);
        }  
    });
 
    // Open a server side websocket connection.
    wss = new PERFUSE.web_sock_server({port: PERFUSE.WS_PORT});
 
    // Define behavior for handling websocket connection requests.
    wss.on('connection', function(ws) {
        console.log('new websocket connected');
        PERFUSE.web_sock = ws;
        // Define behavior for receiving websocket messages.
        ws.on('message', function(msg) {
            try {
                console.log('received from ws client: ' + msg);
                m = JSON.parse(msg);
                msg = JSON.stringify(m);
                try {
                    // Perf test request received. Distribute too all slaves
                    // via the ZeroMQ pub socket.
                    sock_send.send(msg);
                } catch(e) {
                    console.log("error " + e);
                }  
            } catch(e) {
                console.log("error " + e);
            }  
        });
 
        // Define behavior for handling closed websocket connection.
        ws.on('close', function(ws) {
            console.log('websocket disconnected');
            PERFUSE.web_sock = null;
        });
    });
};
