const UserService = require('../services/userService/UserService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "default";

exports.signin = async (req, res) => {
  try {
    const { EmailorUsername, Password } = req.body;
    const user = await UserService.getUserByEmailOrUsername(EmailorUsername);

    if (!user) {
      return res.status(401).send("This email or username does not match with password.");
    }

    const isPasswordValid = await bcrypt.compare(Password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("This email or username does not match with password.");
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1s' });

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict', // Adjust as necessary for your application
      maxAge: 3600000 // 1 hour
      });

    res.status(200).send({ message: "Sign in successful!", user: { id: user.id, name: user.name, surname: user.surname, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).send("An error occurred during sign in.");
  }
}