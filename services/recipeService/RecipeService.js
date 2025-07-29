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

exports.getRecipesByType = async (type, limit = 10, offset = 0) => {
    let types = Array.isArray(type) ? type : [type];
    types = types
        .map(t => {
            // If the type is a string, split it by commas and trim whitespace
            return t.includes(',') ? t.split(',').map(t => t.trim()) : t.trim();
        })
        .flat();
    console.log('Types:', types);
    
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
    
    if (types.length === 0) {
        // If no types are provided, return all recipes
        query = query.replace('WHERE ', '');
    } else {
        // Create a dynamic query for multiple types
        const placeholders = types.map((_, i) => `$${i+1}`).join(', ');
        query += `recipe.type LIKE ANY(ARRAY[${placeholders}])`;
        params = types.map(t => `%${t}%`);
    }
    
    query += ' ORDER BY like_count DESC';
    
    // Add limit and offset
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
};

exports.getTrendRecipes = async (period, limit = 30, offset = 0) => {
    const intervals = {
        daily: '24 hours',
        weekly: '7 days',
        monthly: '30 days',
        annual: '1 year'
    };

    const interval = intervals[period];
    const useInterval = interval !== undefined;

    const whereClause = useInterval ? `WHERE recipe.shared_at >= NOW() - INTERVAL '${interval}'` : '';
    const countWhereClause = useInterval ? `WHERE shared_at >= NOW() - INTERVAL '${interval}'` : '';

    const recipesQuery = `
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
        ${whereClause}
        ORDER BY like_count DESC
        LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) AS total FROM recipes ${countWhereClause}`;

    const [recipesResult, countResult] = await Promise.all([
        db.query(recipesQuery, [limit, offset]),
        db.query(countQuery, [])
    ]);

    const total = parseInt(countResult.rows[0].total);
    return {
        recipes: recipesResult.rows,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit)
    };
};

exports.getBookmarkedRecipes = async (user_id, limit = 10, offset = 0) => {
    const query = `
        SELECT recipe.*,
            COALESCE(likes.count, 0) AS like_count,
            COALESCE(bookmarks.count, 0) AS bookmark_count,
            COALESCE(comments.count, 0) AS comment_count,
            user_bookmark.saved_at AS bookmarked_at
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
        INNER JOIN recipe_bookmarks user_bookmark ON recipe.id = user_bookmark.recipe_id AND user_bookmark.user_id = $1
        ORDER BY user_bookmark.saved_at DESC
        LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [user_id, limit, offset]);
    return result.rows;
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

// -------------------------------------- Comment-related methods -------------------------------------- //

exports.getMainCommentCountByRecipeId = async (recipe_id) => {
    const result = await db.query(
        'SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = $1 AND parent_comment_id IS NULL',
        [recipe_id]
    );
    return parseInt(result.rows[0].count, 10);
};

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