
function route(app, regex, prefix) {
    app.get(regex, function (req, res) {
        var type = req.params[0];
        var path = req.params[1];
        var file = prefix + type + '/' + path
        res.sendfile(file);
    });
}

var express = require('express');

// Constants
var PORT = 80;

// App
var app = express();
app.get('/', function (req, res) {
    res.sendfile('/src/index.html');
});

route(app, /^\/(scripts)\/(.*)/, '/src/');
route(app, /^\/(styles|styleguide|images|fonts)\/(.*)/, '/wsk/');

app.listen(PORT);
console.log('Running on port ' + PORT);
