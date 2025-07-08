const RecipeService = require('../services/recipeService/RecipeService');

exports.addRecipe = async (req, res) => {
    try {
        const { recipe_name, recipe_ingredients, recipe_instructions, user_id } = req.body;
        const recipe = await RecipeService.createRecipe({ recipe_name, recipe_ingredients, recipe_instructions, user_id});

        res.staus(201).send("The recipe is shared successfully!");
    } catch (err) {
        res.status(500).send("The recipe could not be created.");
    }
};