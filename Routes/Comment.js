const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');

const CommentController = require('../Controllers/CommentController');

router.post('/:id/comment/create', authenticateToken, CommentController.createComment);
router.post('/comment/:id/like-or-unlike', authenticateToken, CommentController.likeOrUnlikeComment);

router.get('/:id/comments', authenticateToken, CommentController.getComments);
router.get('/comment/:id/replies', authenticateToken, CommentController.getCommentReplies);
router.get('/comment/:id/root-replies', authenticateToken, CommentController.getRootCommentReplies);

module.exports = router;