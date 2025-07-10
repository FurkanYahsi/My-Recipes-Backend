const db = require('../../Databases/db');

exports.createRecipe = async ({ recipe_name, recipe_ingredients, recipe_instructions, user_id}) => {
    return db.query(
        'INSERT INTO recipes (recipe_name, recipe_ingredients, recipe_instructions, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [recipe_name, recipe_ingredients, recipe_instructions, user_id]
    );
}

exports.getRecipeById = async (recipe_id) => {
    const result = await db.query('SELECT * FROM recipes WHERE id = $1', [recipe_id]);
    return result.rows[0];
}

exports.getRecipesByUserId = async (user_id) => {
    const result = await db.query('SELECT * FROM recipes WHERE user_id = $1', [user_id]);
    return result.rows;
}

exports.getAllRecipesByLikeCount = async () => {
    const result = await db.query(`
    SELECT recipe.*,
        COALESCE(likes.count, 0) AS like_count
    FROM recipes recipe
    LEFT JOIN (
      SELECT recipe_id, COUNT(*) AS count
      FROM recipe_likes
      GROUP BY recipe_id
    ) likes 
    ON likes.recipe_id = recipe.id
    ORDER BY like_count DESC;
    `);
    return result.rows;
}

exports.addLike = async (recipe_id, user_id) => {
    return db.query(
        'INSERT INTO recipe_likes (recipe_id, user_id) VALUES ($1, $2) RETURNING *',
        [recipe_id, user_id]
    );
}

exports.removeLike = async (recipe_id, user_id) => {
    return db.query(
        'DELETE FROM recipe_likes WHERE recipe_id = $1 AND user_id = $2 RETURNING *',
        [recipe_id, user_id]
    );
}

exports.checkIfLiked = async (recipe_id, user_id) => {
    const result = await db.query(
        'SELECT * FROM recipe_likes WHERE recipe_id = $1 AND user_id = $2',
        [recipe_id, user_id]
    );
    return result.rows.length > 0;
}

exports.addBookmark = async (recipe_id, user_id) => {
    return db.query(
        'INSERT INTO recipe_bookmarks (recipe_id, user_id) VALUES ($1, $2) RETURNING *',
        [recipe_id, user_id]
    );
}

exports.removeBookmark = async (recipe_id, user_id) => {
    return db.query(
        'DELETE FROM recipe_bookmarks WHERE recipe_id = $1 AND user_id = $2 RETURNING *',
        [recipe_id, user_id]
    );
}

exports.checkIfBookmarked = async (recipe_id, user_id) => {
    const result = await db.query(
        'SELECT * FROM recipe_bookmarks WHERE recipe_id = $1 AND user_id = $2',
        [recipe_id, user_id]
    );
    return result.rows.length > 0;
}