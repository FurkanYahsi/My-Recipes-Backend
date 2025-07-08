require('dotenv').config();
const { Pool } = require('pg');

const db_recipes = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db_recipes',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

module.exports = db_recipes;