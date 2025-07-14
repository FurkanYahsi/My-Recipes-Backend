const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const server = express();

// Middleware
server.use(express.json()); // To parse JSON. If it's not included, req.body will be undefined.
server.use(cookieParser());

// CORS setting: Accept requests from the React development server
server.use(cors({
  origin: /*'https://furkanyahsi.github.io',*/ 'http://localhost:3000', // React dev server address
  credentials: true                // Allow cookies to be sent
}));

// Routes
const authRoutes = require('./Routes/Auth');
const recipeRoutes = require('./Routes/Recipe');

server.use('/auth', authRoutes);
server.use('/recipe', recipeRoutes);

server.listen(3001);