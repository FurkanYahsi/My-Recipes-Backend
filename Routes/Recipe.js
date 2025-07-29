const express = require('express');
const router = express.Router();
const RecipeController = require('../Controllers/RecipeController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/create', authenticateToken, RecipeController.createRecipe);
router.post('/:id/like-or-unlike', authenticateToken, RecipeController.likeOrUnlikeRecipe);
router.post('/:id/bookmark-or-remove-bookmark', authenticateToken, RecipeController.addBookmarkOrRemoveBookmarkToRecipe);

router.post('/:id/comment/create', authenticateToken, RecipeController.createComment);
router.post('/comment/:id/like-or-unlike', authenticateToken, RecipeController.likeOrUnlikeComment);

router.get('/saved-recipes', authenticateToken, RecipeController.getBookmarkedRecipes);
router.get('/liked-recipes', authenticateToken, RecipeController.getLikedRecipes);
router.get('/trends/:period', authenticateToken, RecipeController.getTrendRecipes);
router.get('/category/:category', authenticateToken, RecipeController.getRecipesByCategory);
router.get('/type/:type', authenticateToken, RecipeController.getRecipesByType);
router.get('/:id', authenticateToken, RecipeController.getRecipeById);

router.get('/:id/comments', authenticateToken, RecipeController.getComments);
router.get('/comment/:id/replies', authenticateToken, RecipeController.getCommentReplies);
router.get('/comment/:id/root-replies', authenticateToken, RecipeController.getRootCommentReplies);

module.exports = router;