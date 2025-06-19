const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "default";

function authenticateToken(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).send("No token provided");

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid token");
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;