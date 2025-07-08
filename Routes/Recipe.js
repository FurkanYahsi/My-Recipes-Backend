const express = require('express');
const router = express.Router();
const RecipeController = require('../Controllers/RecipeController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/create-recipe', authenticateToken, RecipeController.createRecipe);

module.exports = router;