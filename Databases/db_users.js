require('dotenv').config();
const {Pool} = require('pg');

const db_users = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db_users',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

module.exports = db_users;