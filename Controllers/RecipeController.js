const RecipeService = require('../services/recipeService/RecipeService');

exports.createRecipe = async (req, res) => {
    try {
        const { recipe_name, recipe_ingredients, recipe_instructions } = req.body;
        const user_id = req.user.id;

        if (!recipe_name || !recipe_ingredients || !recipe_instructions) {
            return res.status(400).send("Recipe name, ingredients, and instructions are required!");
        }
        
        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }

        const recipe = await RecipeService.createRecipe({ recipe_name, recipe_ingredients, recipe_instructions, user_id});

        res.status(201).send("The recipe is shared successfully!");
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("The recipe could not be created.");
    }
};