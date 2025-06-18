var db_users = require('../Databases/db');
var bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
  try {
    const { Name, Surname, Username, Email, Password } = req.body;
    const hashedPassword = await bcrypt.hash(Password, 10);
    await db_users.query('INSERT INTO users (name, surname, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *', [Name, Surname, Username, Email, hashedPassword]);
    res.status(201).send("The user has been created successfully");
  } catch (err) {
    res.status(500).send("The user could not be created");
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await db_users.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("The users could not be retrieved");
  }
};