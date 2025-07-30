const CommentService = require('../services/commentService/CommentService');
const UserService = require('../services/userService/UserService');

exports.createComment = async (req, res) => {
    const recipe_id = req.params.id;
    const user_id = req.user.id;
    const { parent_comment_id, content, root_comment_id } = req.body;

    if (!user_id) {
        return res.status(401).send("User authentication required!");
    }

    if (!content) {
        return res.status(400).send("Comment content is required!");
    }

    try {
        const comment = await CommentService.createComment(recipe_id, user_id, parent_comment_id, content, root_comment_id);
        res.status(201).json(comment.rows[0]);
    } catch (err) {
        console.error("Error creating comment:", err);
        res.status(500).send("Could not create the comment.");
    }
}

exports.getComments = async (req, res) => {
    try {
        const recipe_id = req.params.id;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;

        if (!recipe_id) {
            return res.status(400).send("Recipe ID is required!");
        }

        const comments = await CommentService.getMainCommentsByRecipeId(recipe_id, limit, offset);
        
        if (user_id) {
            for (let comment of comments) {
                comment.is_liked = await CommentService.checkIfCommentLiked(comment.id, user_id);
                
                try {
                    const user = await UserService.getUserById(comment.user_id);
                    comment.username = user.username;
                    comment.user_name = user.name;
                    comment.user_surname = user.surname;
                } catch (err) {
                    console.error("Error fetching user for comment:", err);
                }
            }
        }
        
        res.status(200).json(comments);
    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).send("Could not retrieve comments.");
    }
};

exports.getCommentReplies = async (req, res) => {
    try {
        const parent_id = req.params.id;
        const limit = parseInt(req.query.limit || '10');
        const user_id = req.user?.id;

        if (!parent_id) {
            return res.status(400).send("Parent comment ID is required!");
        }

        const replies = await CommentService.getRepliesByParentCommentId(parent_id, limit);
        
        if (user_id) {
            for (let reply of replies) {
                reply.is_liked = await CommentService.checkIfCommentLiked(reply.id, user_id);
                
                try {
                    const user = await UserService.getUserById(reply.user_id);
                    reply.username = user.username;
                    reply.user_name = user.name;
                    reply.user_surname = user.surname;
                } catch (err) {
                    console.error("Error fetching user for reply:", err);
                }
            }
        }
        
        res.status(200).json(replies);
    } catch (err) {
        console.error("Error fetching comment replies:", err);
        res.status(500).send("Could not retrieve comment replies.");
    }
};

exports.getRootCommentReplies = async (req, res) => {
    try {
        const root_comment_id = req.params.id;
        const limit = parseInt(req.query.limit || '10');
        const page = parseInt(req.query.page || '1');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;

        if (!root_comment_id) {
            return res.status(400).send("Root comment ID is required!");
        }

        const replies = await CommentService.getRepliesByRootCommentId(root_comment_id, limit, offset);
        
        // Kullanıcı giriş yapmışsa beğeni durumunu kontrol et
        if (user_id) {
            for (let reply of replies) {
                reply.is_liked = await CommentService.checkIfCommentLiked(reply.id, user_id);
                
                try {
                    const user = await UserService.getUserById(reply.user_id);
                    reply.username = user.username;
                    reply.user_name = user.name;
                    reply.user_surname = user.surname;
                } catch (err) {
                    console.error("Error fetching user for reply:", err);
                }
            }
        }
        
        res.status(200).json(replies);
    } catch (err) {
        console.error("Error fetching root comment replies:", err);
        res.status(500).send("Could not retrieve replies.");
    }
};

exports.likeOrUnlikeComment = async (req, res) => {
    try {
        const comment_id = req.params.id;
        const user_id = req.user.id;

        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }

        const liked = await CommentService.checkIfCommentLiked(comment_id, user_id);
        
        if (liked) {
            await CommentService.unlikeComment(comment_id, user_id);
            res.status(200).json({ liked: false, message: "Comment unliked successfully!" });
        } else {
            await CommentService.likeComment(comment_id, user_id);
            res.status(200).json({ liked: true, message: "Comment liked successfully!" });
        }
    } catch (err) {
        console.error("Error toggling comment like:", err);
        res.status(500).send("Could not process the comment like/unlike action.");
    }
};