const UserService = require('../services/userService/UserService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "default";

exports.signin = async (req, res) => {
  try {
    const { EmailorUsername, Password } = req.body;
    const user = await UserService.getUserByEmailOrUsername(EmailorUsername);

    if (!user) {
      return res.status(400).send("This email or username does not match with password.");
    }

    if (Password !== user.password) {
      return res.status(400).send("This email or username does not match with password.");
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 3600000 // 1 hour
    });

    res.status(200).send({
      message: "Sign in successful!",
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).send("An error occurred during sign in.");
  }
}