var express = require('express');
var server = express();
var cors = require('cors');
var path = require('path');

server.use(express.json()); // To parse JSON. If it's not included, req.body will be undefined.
server.use(cors());

const authRoutes = require('./Routes/Auth');
server.use('/api/auth', authRoutes);

server.use(express.static(path.join(__dirname, '../My-Recipes-Frontend/build')));

server.use(function (req, res, next) {
   res.sendFile(path.join(__dirname, '../My-Recipes-Frontend/build', 'index.html'));
});

server.listen(3000);