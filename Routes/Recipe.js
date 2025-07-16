const express = require('express');
const router = express.Router();
const RecipeController = require('../Controllers/RecipeController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/create', authenticateToken, RecipeController.createRecipe);
router.post('/:id/like-or-unlike', authenticateToken, RecipeController.likeOrUnlikeRecipe);
router.post('/:id/bookmark-or-remove-bookmark', authenticateToken, RecipeController.addBookmarkOrRemoveBookmarkToRecipe);

router.post('/:id/comment/create', authenticateToken, RecipeController.createComment);
router.post('/comment/:id/like-or-unlike', authenticateToken, RecipeController.likeOrUnlikeComment);

router.get('/trends', authenticateToken, RecipeController.getRecipesByPopularity);
router.get('/:id', authenticateToken, RecipeController.getRecipeById);

router.get('/:id/comments', authenticateToken, RecipeController.getComments);
router.get('/comment/:id/replies', authenticateToken, RecipeController.getCommentReplies);

module.exports = router;