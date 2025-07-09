const db = require('../../Databases/db');

exports.createUser = async ({ Name, Surname, Username, Email, Password }) => {
  return db.query(
    'INSERT INTO users (name, surname, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [Name, Surname, Username, Email, Password]
  );
};

exports.getUserByEmailOrUsername = async (EmailorUsername) => {
  let result = await db.query('SELECT * FROM users WHERE email = $1', [EmailorUsername]);
  if (result.rows.length === 0) {
    result = await db.query('SELECT * FROM users WHERE username = $1', [EmailorUsername]);
  }
  return result.rows[0];
};

exports.getAllUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
};

exports.getUserById = async (user_id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
  return result.rows[0];
};