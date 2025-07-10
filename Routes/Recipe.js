const express = require('express');
const router = express.Router();
const RecipeController = require('../Controllers/RecipeController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/create', authenticateToken, RecipeController.createRecipe);
router.post('/:id/like-or-unlike', authenticateToken, RecipeController.likeOrUnlikeRecipe);
router.post('/:id/bookmark-or-remove-bookmark', authenticateToken, RecipeController.addBookmarkOrRemoveBookmarkToRecipe);

router.get('/trends', authenticateToken, RecipeController.getRecipesByPopularity);

module.exports = router;