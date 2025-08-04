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

exports.getRecipesByUserId = async (user_id, limit = 10, offset = 0) => {
    try {
        const query = `
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
            WHERE recipe.user_id = $1
            ORDER BY recipe.shared_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM recipes
            WHERE user_id = $1
        `;
        
        const recipesResult = await db.query(query, [user_id, limit, offset]);
        const countResult = await db.query(countQuery, [user_id]);
        
        const total = parseInt(countResult.rows[0]?.total || '0');
        
        return {
            recipes: recipesResult.rows,
            total,
            page: Math.floor(offset / limit) + 1,
            limit,
            pages: Math.ceil(total / limit) || 1
        };
    } catch (error) {
        console.error('Error in getRecipesByUserId:', error);
        throw error;
    }
};

exports.getRecipesByCategory = async (category, limit = 10, offset = 0) => {

    try {
        let categories = Array.isArray(category) ? category : [category];
        categories = categories
            .map(cat => {
                // If the category is a string, split it by commas and trim whitespace
                return cat.includes(',') ? cat.split(',').map(c => c.trim()) : cat.trim();
            })
            .flat();
        
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
            ) comments ON comments.recipe_id = recipe.id`;
        
        let whereClause = '';
        let queryParams = [];
            
        if (categories.length === 0) {
            // No filter
        } else {
            // Add WHERE clause
            whereClause = ` WHERE recipe.category LIKE ANY(ARRAY[${categories.map((_, i) => `$${i+1}`).join(', ')}])`;
            query += whereClause;
            queryParams = categories.map(cat => `%${cat}%`);
        }
        
        query += ' ORDER BY like_count DESC';
        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        
        // Final params for main query
        const finalQueryParams = [...queryParams, limit, offset];
        
        // Separate count query (safer approach)
        let countQuery = 'SELECT COUNT(*) AS total FROM recipes recipe';
        if (whereClause) {
            countQuery += whereClause;
        }
        
        // Execute queries sequentially to avoid parameter issues
        const recipesResult = await db.query(query, finalQueryParams);
        const countResult = await db.query(countQuery, queryParams);
        
        const total = parseInt(countResult.rows[0]?.total || '0');
        
        return {
            recipes: recipesResult.rows,
            total,
        };
    } catch (error) {
        console.error('Error in getRecipesByCategory:', error);
        throw error;
    }
};

exports.getRecipesByType = async (type, limit = 10, offset = 0) => {
    try {
        let types;
        
        // Split the type parameter if it's a string or flatten it if it's an array
        if (typeof type === 'string') {
            types = type.split(',').map(t => t.trim());
        } else if (Array.isArray(type)) {
            types = type.flat();
        } else {
            types = [];
        }
                
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
            ) comments ON comments.recipe_id = recipe.id`;
        
        let queryParams = [];
        let placeholders = [];
        
        // Create a dynamic query for multiple types
        if (types.length > 0) {
            for (let i = 0; i < types.length; i++) {
                queryParams.push(`%${types[i]}%`);
                placeholders.push(`$${i+1}`);
            }
            
            query += ` WHERE recipe.type ILIKE ANY(ARRAY[${placeholders.join(', ')}])`;
        }
        
        // Add ordering and pagination
        query += ' ORDER BY like_count DESC';
        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        
        queryParams.push(limit, offset);
        
        // Count query
        let countQuery = 'SELECT COUNT(*) AS total FROM recipes recipe';
        if (types.length > 0) {
            countQuery += ` WHERE type ILIKE ANY(ARRAY[${placeholders.join(', ')}])`;
        }
        
        const [recipesResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2)) // exclude limit and offset from count query
        ]);
        
        return {
            recipes: recipesResult.rows,
            total: parseInt(countResult.rows[0].total),
        };
    } catch (error) {
        console.error('Error in getRecipesByType:', error);
        throw error;
    }
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
    try {
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
        
        // Basic count query (to reduce complexity)
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM recipe_bookmarks
            WHERE user_id = $1
        `;
        
        const recipesResult = await db.query(query, [user_id, limit, offset]);
        const countResult = await db.query(countQuery, [user_id]);
        
        const total = parseInt(countResult.rows[0]?.total || '0');
        
        return {
            recipes: recipesResult.rows,
            total,
        };
    } catch (error) {
        console.error('Error in getBookmarkedRecipes:', error);
        throw error;
    }
};

exports.getLikedRecipes = async (user_id, limit = 10, offset = 0) => {
    try {
        const query = `
            SELECT recipe.*,
                COALESCE(likes.count, 0) AS like_count,
                COALESCE(bookmarks.count, 0) AS bookmark_count,
                COALESCE(comments.count, 0) AS comment_count,
                user_like.liked_at AS liked_at
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
            INNER JOIN recipe_likes user_like ON recipe.id = user_like.recipe_id AND user_like.user_id = $1
            ORDER BY user_like.liked_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM recipe_likes
            WHERE user_id = $1
        `;
        
        const recipesResult = await db.query(query, [user_id, limit, offset]);
        const countResult = await db.query(countQuery, [user_id]);
        
        const total = parseInt(countResult.rows[0]?.total || '0');
        
        return {
            recipes: recipesResult.rows,
            total,
        };
    } catch (error) {
        console.error('Error in getLikedRecipes:', error);
        throw error;
    }
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

exports.updateRecipe = async (recipe_id, { recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type }) => {
  return db.query(
    `UPDATE recipes 
     SET recipe_name = $1, 
         recipe_story = $2, 
         recipe_ingredients = $3, 
         recipe_instructions = $4, 
         category = $5, 
         type = $6, 
         updated_at = NOW()
     WHERE id = $7 
     RETURNING *`,
    [recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type, recipe_id]
  );
};

exports.deleteRecipe = async (recipe_id) => {
  try {
    const result = await db.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [recipe_id]);
    return result.rows[0];
  } catch (e) {
    console.error("Error deleting recipe:", e);
    throw e;
  }
};