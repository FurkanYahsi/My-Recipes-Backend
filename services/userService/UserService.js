const db = require('../../Databases/db');

exports.createUser = async ({ Name, Surname, Username, Email, Password, Role = 'user' }) => {
  return db.query(
    'INSERT INTO users (name, surname, username, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [Name, Surname, Username, Email, Password, Role]
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

exports.changeUserRole = async (user_id, newRole) => {
  const result = await db.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
    [newRole, user_id]
  );
  return result.rows[0];
};

exports.isUserAdmin = async (user_id) => {
    try {
        const result = await db.query(
            'SELECT role FROM users WHERE id = $1',
            [user_id]
        );
        
        // If the user is not found, return false
        if (result.rows.length === 0) {
            return false;
        }
        
        return result.rows[0].role === 'admin';
    } catch (error) {
        console.error('Error checking if user is admin:', error);
        return false;
    }
};

exports.isUserEditor = async (user_id) => {
    try {
        const result = await db.query(
            'SELECT role FROM users WHERE id = $1',
            [user_id]
        );
        
        // If the user is not found, return false
        if (result.rows.length === 0) {
            return false;
        }
        
        return result.rows[0].role === 'editor';
    } catch (error) {
        console.error('Error checking if user is editor:', error);
        return false;
    }
};