var db_users = require('../Databases/db');
var bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
  try {
    const { Name, Surname, Username, Email, Password } = req.body;
    const hashedPassword = await bcrypt.hash(Password, 10);
    await db_users.query('INSERT INTO users (name, surname, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *', [Name, Surname, Username, Email, hashedPassword]);
    res.status(201).send("The user has been created successfully");
  } catch (err) {
    if (err.code === '23505' && err.detail) { // 23505 is the unique violation error code in PostgreSQL

        if (err.detail.includes('username') && err.detail.includes('email')) {
            return res.status(409).send("This username and email are already exists!");
        }
        if (err.detail.includes('username')) {
            return res.status(409).send("This username is already exists!");
        }
        if (err.detail.includes('email')) {
            return res.status(409).send("This email is already exists!");
        }
    }
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