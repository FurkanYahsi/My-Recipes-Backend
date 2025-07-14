const db = require('../../Databases/db');

exports.createRecipe = async ({ recipe_name, recipe_story, recipe_ingredients, recipe_instructions, user_id}) => {
    return db.query(
        'INSERT INTO recipes (recipe_name, recipe_story, recipe_ingredients, recipe_instructions, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [recipe_name, recipe_story, recipe_ingredients, recipe_instructions, user_id]
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
        COALESCE(likes.count, 0) AS like_count,
        COALESCE(bookmarks.count, 0) AS bookmark_count
    FROM recipes recipe
    LEFT JOIN (
      SELECT recipe_id, COUNT(*) AS count
      FROM recipe_likes
      GROUP BY recipe_id
    ) likes ON likes.recipe_id = recipe.id
    LEFT JOIN (
      SELECT recipe_id, COUNT(*) AS count
      FROM recipe_bookmarks
      GROUP BY recipe_id
    ) bookmarks ON bookmarks.recipe_id = recipe.id
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

exports.createComment = async (recipe_id, user_id, parent_comment_id, content) => {
    return db.query(
        'INSERT INTO recipe_comments (recipe_id, user_id, parent_comment_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [recipe_id, user_id, parent_comment_id, content]
    );
}

exports.getMainCommentsByRecipeId = async (recipe_id, limit, offset) => {
    const result = await db.query(`
        SELECT comment.*, 
        COUNT(comment_like.id) AS like_count
        FROM recipe_comments comment
        LEFT JOIN comment_likes comment_like ON comment.id = comment_like.comment_id
        WHERE comment.recipe_id = $1 AND comment.parent_comment_id IS NULL
        GROUP BY comment.id
        ORDER BY comment.created_at ASC
        LIMIT $2 OFFSET $3
    `, [recipe_id, limit, offset]);    
    return result.rows;
};

exports.getRepliesByParentCommentId = async (parent_comment_id, limit, offset) => {
    const result = await db.query(`
        SELECT comment.*, 
        COUNT(comment_like.id) AS like_count
        FROM recipe_comments comment
        LEFT JOIN comment_likes comment_like ON comment.id = comment_like.comment_id
        WHERE comment.parent_comment_id = $1
        GROUP BY comment.id
        ORDER BY comment.created_at ASC
        LIMIT $2 OFFSET $3
    `, [parent_comment_id, limit, offset]);
    
    return result.rows;
};