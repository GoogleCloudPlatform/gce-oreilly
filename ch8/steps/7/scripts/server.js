
function route(app, regex, prefix) {
    app.get(regex, function (req, res) {
      var type = req.params[0];
      var path = req.params[1];
      var file = prefix + type + '/' + path
      res.sendfile(file);
    });
}

var os = require('os');
var ifaces = os.networkInterfaces();
var ipaddr = ifaces['eth0'][0].address;
console.log('ipaddr', ipaddr);

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
        hostnum: os.hostname().split('-')[1],
        ipaddr: ipaddr,
        web_sock_server: require('ws').Server,
        web_sock: null,
        slaves: {},
        pubsub_port: process.env.PERFUSE_PUBSUB_PORT,
        p2p_port: process.env.PERFUSE_P2P_PORT
    }
}());

if (PERFUSE.hostname === PERFUSE.MASTER) {
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
    sock_recv.on('message', function(msg){
        try {
            var ev = JSON.parse(msg);
            if (ev.type == 'perf') {
                console.log('event received from slave: ' + msg);
                // We received a perf test response from a slave. If we 
                // have a websockets connection, forward the result to 
                // the client so that it can be presented to the user.
                if (PERFUSE.web_sock) {
                    try {
                        var ev_str = msg.toString();
                        PERFUSE.web_sock.send(ev_str);
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
} else {
    console.log('Slave running');

    // Init ZeroMQ sub socket for receiving pub requests, and
    // push socket for sending point-to-point responses to master.
    sock_recv = PERFUSE.zmq.socket('sub');
    sock_send = PERFUSE.zmq.socket('push');
    //sock_recv.connect('tcp://perfuse-dev' + ':' + PERFUSE.REQ_PORT);
    //sock_send.connect('tcp://perfuse-dev' + ':' + PERFUSE.RES_PORT);
    console.log('connecting to pubsub @', PERFUSE.pubsub_port, 'and p2p @', PERFUSE.p2p_port)
    if (PERFUSE.pubsub_port && PERFUSE.p2p_port) {
      sock_recv.connect(PERFUSE.pubsub_port);
      sock_send.connect(PERFUSE.p2p_port);
    } else {
      sock_recv.connect('tcp://' + PERFUSE.MASTER + ':' + PERFUSE.REQ_PORT);
      sock_send.connect('tcp://' + PERFUSE.MASTER + ':' + PERFUSE.RES_PORT);
    }

    // Define behavior for handling test requests.
    sock_recv.on('message', function(msg){
        try {
            console.log('received from master: ' + msg);
            var msg = JSON.parse(msg);
            var args = msg.cmd.split(" ");
            console.log('args: ' + JSON.stringify(args));
            var cmd = args.shift();
            var regexp = new RegExp(msg.regexp);
            var skip = false;
            // disk regexp: /\s+([\d\.]+)\s+Mbits\/s/;
            // net regexp:  /\s*READ:.* aggrb=(.*)KB\/s, minb=/;
            if (msg.type === 'net') {
                // Network tests have special semantics - every second
                // VM runs a test on the intervening VMs.
                var index = 0;
                var i = 0;
                // This loop sets index to the nominal VM number 
                // associated with this VM.
                for (i in msg.slaves) {
                    if (msg.slaves[i] === PERFUSE.hostnum) {
                        break;
                    }
                    index++;
                }
                // Find the matching VM for this network test (one after
                // this one with wrap around logic).
                if ((index%2) === 0) {
                    // Even nominal number so this VM is an active tester.
                    // Set server to the destination VM number.
                    var server = 0;
                    if (i === (msg.slaves.length - 1)) {
                        // Wrap around, if necessary.
                        server = 1;
                    } else {
                        server = msg.slaves[index + 1];
                    }
                    args[1]= args[1].replace('%d', server);
                } else {
                    // Odd nominal number so this is a passive, test
                    // subject VM. Nothing special to do for this case.
                    skip = true;
                }
            } else if (msg.type === 'random') {
                cmd = msg.type;
            }
            if (!skip) {
                // Run the perf test command and send results
                // to sock_send (ZeroMQ push socket).
                run_cmd(PERFUSE.hostnum, cmd, args, regexp, sock_send);
            }
        } catch(e) {
            console.log("error " + e);
        }  
    });

    // Run a perf test command. Caller passes command to run,
    // arguments, regexp to use to extract result, and socket
    // on which to send JSON encoded result.
    function run_cmd(hostnum, cmd, args, regexp, sock) {
        var resp = null;
        var resp_str = null;
        console.log('running cmd: ' + cmd + ' w/ args: ' + args);
        if (cmd == 'random') {
            resp = { type: 'perf', host: PERFUSE.ipaddr, value: Math.random() };
            resp_str = JSON.stringify(resp);
            console.log('response: ' + resp_str);
            try {
                sock.send(resp_str);
            } catch(e) {
                console.log("error " + e);
            }  
            return;
        }

        // Start running test command and process returned data asynchrously.
        var proc = spawn(cmd, args);

        // Handle data received from test command one line at a time.
        proc.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
            // Match passed regexp against each line of data from test command.
            var match = regexp.exec(data);
            console.log('running ' + regexp + ' on ' + data + ' yielded ' + match);
            if (match) {
                // If we match a line, JSON format result and send to master.
                resp = { type: 'perf', host: PERFUSE.ipaddr, value: match[1] };
                resp_str = JSON.stringify(resp);
                console.log('response: ' + resp_str);
                try {
                    sock.send(resp_str);
                } catch(e) {
                    console.log("error " + e);
                }  
            }
        });

        // Log test exec errors to console.
        proc.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        // Handle command completion event.
        proc.on('close', function (code) {
            console.log('child process exited with code ' + code);
        });
    };

    sock_recv.subscribe('');
}
