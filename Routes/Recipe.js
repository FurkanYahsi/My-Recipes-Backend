const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

const RecipeController = require('../Controllers/RecipeController');

router.post('/create', authenticateToken, RecipeController.createRecipe);
router.post('/:id/like-or-unlike', authenticateToken, RecipeController.likeOrUnlikeRecipe);
router.post('/:id/bookmark-or-remove-bookmark', authenticateToken, RecipeController.addBookmarkOrRemoveBookmarkToRecipe);

router.get('/saved-recipes', authenticateToken, RecipeController.getBookmarkedRecipes);
router.get('/liked-recipes', authenticateToken, RecipeController.getLikedRecipes);
router.get('/trends/:period', authenticateToken, RecipeController.getTrendRecipes);
router.get('/category/:category', authenticateToken, RecipeController.getRecipesByCategory);
router.get('/type/:type', authenticateToken, RecipeController.getRecipesByType);
router.get('/:id', authenticateToken, RecipeController.getRecipeById);

router.put('/:id/edit', authenticateToken, RecipeController.editRecipe);
router.delete('/:id/delete', authenticateToken, RecipeController.deleteRecipe);
module.exports = router;