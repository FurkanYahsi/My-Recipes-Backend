var db_users = require('../Databases/db');
var bcrypt = require('bcrypt');

exports.signin = async (req, res) => {
  try {
    const { EmailorUsername, Password } = req.body;
    let result;

    if (EmailorUsername) {
        result = await db_users.query('SELECT * FROM users WHERE email = $1', [EmailorUsername]);
    } 
    if (result.rows.length === 0) {
        result = await db_users.query('SELECT * FROM users WHERE username = $1', [EmailorUsername]);
    }

    if (result.rows.length === 0) {
      return res.status(404).send("This email or username does not exist");
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(Password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    }

    res.status(200).send({ message: "Sign in successful", user: { id: user.id, name: user.name, surname: user.surname, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).send("An error occurred during sign in");
  }
}