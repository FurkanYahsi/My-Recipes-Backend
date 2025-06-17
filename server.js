var express = require('express');
var server = express();
var cors = require('cors');
var bcrypt = require('bcrypt');
var path = require('path');
var db_users = require('./db.js');

server.use(express.json()); // To parse JSON bodies. If it's not included, req.body will be undefined.
server.use(cors());

server.post('/api/auth/signup', async (req, res) => {
  try {
    const { Name, Surname, Username, Email, Password } = req.body;
    const hashedPassword = await bcrypt.hash(Password, 10);
    await db_users.query('INSERT INTO users (Name, Surname, Username, Email, Password) VALUES ($1, $2, $3, $4, $5) RETURNING *', [Name, Surname, Username, Email, hashedPassword]);
    res.status(201).send("The user has been created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("The user could not be created");
  }
});

server.get('/api/users', async (req, res) => {
  try {
    const result = await db_users.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("The users could not be retrieved");
  }
});

server.use(express.static(path.join(__dirname, '../My-Recipes-Frontend/build')));

server.use(function (req, res, next) {
   res.sendFile(path.join(__dirname, '../My-Recipes-Frontend/build', 'index.html'));
});

server.listen(3000);