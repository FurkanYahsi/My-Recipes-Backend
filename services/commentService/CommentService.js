const db = require('../../Databases/db');

exports.createComment = async (recipe_id, user_id, parent_comment_id, content, root_comment_id = null) => {
    return db.query(
        'INSERT INTO recipe_comments (recipe_id, user_id, parent_comment_id, content, root_comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [recipe_id, user_id, parent_comment_id, content, root_comment_id]
    );
}

exports.getMainCommentCountByRecipeId = async (recipe_id) => {
    const result = await db.query(
        'SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = $1 AND parent_comment_id IS NULL',
        [recipe_id]
    );
    return parseInt(result.rows[0].count, 10);
};

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