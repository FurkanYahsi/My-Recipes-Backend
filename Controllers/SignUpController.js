const UserService = require('../services/userService/UserService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "default";


exports.signup = async (req, res) => {
  try {
    const { Name, Surname, Username, Email, Password } = req.body;
    const user = await UserService.createUser({ Name, Surname, Username, Email, Password });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 3600000 // 1 hour
    });
  
    res.status(201).send("The user has been created successfully!");
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
    res.status(500).send("The user could not be created.");
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).send("The users could not be retrieved.");
  }
};