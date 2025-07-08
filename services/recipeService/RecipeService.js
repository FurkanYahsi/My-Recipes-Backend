const db_recipes = require('../../Databases/db_recipes');

exports.createRecipe = async ({ recipe_name, recipe_ingredients, recipe_instructions, user_id}) => {
    return db_recipes.query(
        'INSERT INTO recipes (recipe_name, recipe_ingredients, recipe_instructions, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [recipe_name, recipe_ingredients, recipe_instructions, user_id]
    );
};