const db_users = require('../../Databases/db');

exports.createUser = async ({ Name, Surname, Username, Email, Password }) => {
  return db_users.query(
    'INSERT INTO users (name, surname, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [Name, Surname, Username, Email, Password]
  );
};

exports.getUserByEmailOrUsername = async (EmailorUsername) => {
  let result = await db_users.query('SELECT * FROM users WHERE email = $1', [EmailorUsername]);
  if (result.rows.length === 0) {
    result = await db_users.query('SELECT * FROM users WHERE username = $1', [EmailorUsername]);
  }
  return result.rows[0];
};

exports.getAllUsers = async () => {
  const result = await db_users.query('SELECT * FROM users');
  return result.rows;
};