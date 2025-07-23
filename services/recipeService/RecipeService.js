const db = require('../../Databases/db');

exports.createRecipe = async ({ recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type, user_id}) => {
    return db.query(
        'INSERT INTO recipes (recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type, user_id]
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

exports.getRecipesByCategory = async (category, limit = 10, offset = 0) => {

    let categories = Array.isArray(category) ? category : [category];
    categories = categories
        .map(cat => {
            // If the category is a string, split it by commas and trim whitespace
            return cat.includes(',') ? cat.split(',').map(c => c.trim()) : cat.trim();
        })
        .flat();
    console.log('Category:', categories);
    let query = `
        SELECT recipe.*,
            COALESCE(likes.count, 0) AS like_count,
            COALESCE(bookmarks.count, 0) AS bookmark_count,
            COALESCE(comments.count, 0) AS comment_count
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
        LEFT JOIN (
            SELECT recipe_id, COUNT(*) AS count
            FROM recipe_comments
            GROUP BY recipe_id
        ) comments ON comments.recipe_id = recipe.id
        WHERE `;
    
    let params = [];
        
    if (categories.length === 0) {
        // If no categories are provided, return all recipes
        query = query.replace('WHERE ', '');
    } else {
        // Create a dynamic query for multiple categories
        const placeholders = categories.map((_, i) => `$${i+1}`).join(', ');
        query += `recipe.category LIKE ANY(ARRAY[${placeholders}])`;
        params = categories.map(cat => `%${cat}%`);
    }
    
    
    query += ' ORDER BY like_count DESC';
    
    // Limit and offset
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
};

exports.getAllRecipesByLikeCount = async () => {
    const result = await db.query(`
    SELECT recipe.*,
        COALESCE(likes.count, 0) AS like_count,
        COALESCE(bookmarks.count, 0) AS bookmark_count,
        COALESCE(comments.count, 0) AS comment_count
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
    LEFT JOIN (
      SELECT recipe_id, COUNT(*) AS count
      FROM recipe_comments
      GROUP BY recipe_id
    ) comments ON comments.recipe_id = recipe.id
    ORDER BY like_count DESC;
    `);
    return result.rows;
}


exports.getMainCommentCountByRecipeId = async (recipe_id) => {
    const result = await db.query(
        'SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = $1 AND parent_comment_id IS NULL',
        [recipe_id]
    );
    return parseInt(result.rows[0].count, 10);
};

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

exports.createComment = async (recipe_id, user_id, parent_comment_id, content, root_comment_id = null) => {
    return db.query(
        'INSERT INTO recipe_comments (recipe_id, user_id, parent_comment_id, content, root_comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [recipe_id, user_id, parent_comment_id, content, root_comment_id]
    );
}

exports.getMainCommentsByRecipeId = async (recipe_id, limit, offset) => {
    const result = await db.query(`
        SELECT 
            comment.*,
            COUNT(DISTINCT comment_like.id) AS like_count,
            (
                SELECT COUNT(*) 
                FROM recipe_comments replies 
                WHERE replies.root_comment_id = comment.id AND replies.id != comment.id
            ) AS reply_count
            
        FROM recipe_comments comment
        LEFT JOIN comment_likes comment_like ON comment.id = comment_like.comment_id
        WHERE comment.recipe_id = $1 AND comment.parent_comment_id IS NULL
        GROUP BY comment.id
        ORDER BY comment.created_at ASC
        LIMIT $2 OFFSET $3
    `, [recipe_id, limit, offset]);    
    return result.rows;
};


exports.getRepliesByParentCommentId = async (parent_comment_id, limit) => {
    const result = await db.query(`
        SELECT comment.*, 
        COUNT(comment_like.id) AS like_count
        FROM recipe_comments comment
        LEFT JOIN comment_likes comment_like ON comment.id = comment_like.comment_id
        WHERE comment.parent_comment_id = $1
        GROUP BY comment.id
        ORDER BY comment.created_at ASC
        LIMIT $2
    `, [parent_comment_id, limit]);
    
    return result.rows;
};

exports.getRepliesByRootCommentId = async (root_comment_id, limit = 10, offset = 0) => {
    const result = await db.query(`
        SELECT comment.*, 
        COUNT(comment_like.id) AS like_count
        FROM recipe_comments comment
        LEFT JOIN comment_likes comment_like ON comment.id = comment_like.comment_id
        WHERE comment.root_comment_id = $1 AND comment.id != $1
        GROUP BY comment.id
        ORDER BY comment.created_at ASC
        LIMIT $2 OFFSET $3
    `, [root_comment_id, limit, offset]);
    
    return result.rows;
};

exports.likeComment = async (comment_id, user_id) => {
    return db.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) RETURNING *',
        [comment_id, user_id]
    );
};

exports.unlikeComment = async (comment_id, user_id) => {
    return db.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING *',
        [comment_id, user_id]
    );
};

exports.checkIfCommentLiked = async (comment_id, user_id) => {
    const result = await db.query(
        'SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [comment_id, user_id]
    );
    return result.rows.length > 0;
};