var express = require('express');
var path = require('path');

var server = express();

server.use(express.static(path.join(__dirname, '../My-Recipes-Frontend/build')));

// server.get('/test', function (req, res) {
//     console.log("test endpoint hit");
// });

server.use(function (req, res, next) {
   res.sendFile(path.join(__dirname, '../My-Recipes-Frontend/build', 'index.html'));
});

server.listen(3001);