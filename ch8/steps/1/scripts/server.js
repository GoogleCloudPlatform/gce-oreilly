var spawn = require('child_process').spawn,
    cmd = spawn('npm', ['link']);

cmd.on('close', function (code) {
  console.log('child process exited with code ' + code);
  if (code === 0) {
    var express = require('express');

    // Constants
    var PORT = 80;

    // App
    var app = express();
    app.get('/', function (req, res) {
      res.send('Hello World\n');
    });

    app.listen(PORT);
    console.log('Running on port ' + PORT);
  }
});
