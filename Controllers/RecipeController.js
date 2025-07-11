const RecipeService = require('../services/recipeService/RecipeService');
const UserService = require('../services/userService/UserService'); 

exports.createRecipe = async (req, res) => {
    try {
        const { recipe_name, recipe_story, recipe_ingredients, recipe_instructions } = req.body;
        const user_id = req.user.id;

        if (!recipe_name || !recipe_ingredients || !recipe_instructions) {
            return res.status(400).send("Recipe name, ingredients, and instructions are required!");
        }
        
        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }

        const recipe = await RecipeService.createRecipe({ recipe_name, recipe_story, recipe_ingredients, recipe_instructions, user_id});

        res.status(201).send("The recipe is shared successfully!");
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("The recipe could not be created.");
    }
};

exports.getRecipesByPopularity = async (req, res) => {
    try {
        const recipes = await RecipeService.getAllRecipesByLikeCount();
        const user_id = req.user?.id; 
              
       for (let recipe of recipes) {
            recipe.is_liked = await RecipeService.checkIfLiked(recipe.id, user_id);
            recipe.is_bookmarked = await RecipeService.checkIfBookmarked(recipe.id, user_id);
       
            try {
                const user = await UserService.getUserById(recipe.user_id);                    
                recipe.username = `${user.username}`;                   

            } catch (err) {
                console.error("Error fetching user:", err);
                recipe.user_name = "Anonim";
            }
        }
        
        // console.log("Recipe after adding is_liked:", JSON.stringify(recipes[0]));
        res.status(200).json(recipes);
    } catch (err) {
        console.error("Error fetching recipes by popularity:", err);
        res.status(500).send("Could not retrieve recipes.");
    }
};

exports.likeOrUnlikeRecipe = async (req, res) => {
    const recipe_id = req.params.id;
    const user_id = req.user.id;

    if (!user_id) {
        return res.status(401).send("User authentication required!");
    }

    try {
        const liked = await RecipeService.checkIfLiked(recipe_id, user_id);
        if (liked) {
            await RecipeService.removeLike(recipe_id, user_id);
            res.status(200).send("Recipe unliked successfully!");

        } else {
            await RecipeService.addLike(recipe_id, user_id);
            res.status(200).send("Recipe liked successfully!");
        }
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Could not process the like/unlike the recipe.");
    }
}

exports.addBookmarkOrRemoveBookmarkToRecipe = async (req, res) => {
    const recipe_id = req.params.id;
    const user_id = req.user.id;

    if (!user_id) {
        return res.status(401).send("User authentication required!");
    }

    try {
        const bookmarked = await RecipeService.checkIfBookmarked(recipe_id, user_id);
        if (bookmarked) {
            await RecipeService.removeBookmark(recipe_id, user_id);
            res.status(200).send("Recipe bookmark removed successfully!");
        } else {
            await RecipeService.addBookmark(recipe_id, user_id);
            res.status(200).send("Recipe bookmarked successfully!");
        }
    } catch (err) {
        console.error("Error", err);
        res.status(500).send("Could not process the 'bookmark/remove bookmark' the recipe.");
    }
}

exports.getRecipeById = async (req, res) => {
    const recipe_id = req.params.id;
    const user_id = req.user?.id; 

    try {
        const recipe = await RecipeService.getRecipeById(recipe_id);
        if (!recipe) {
            return res.status(404).send("Recipe not found.");
        }

        recipe.is_liked = await RecipeService.checkIfLiked(recipe.id, user_id);
        recipe.is_bookmarked = await RecipeService.checkIfBookmarked(recipe.id, user_id);

        res.status(200).json(recipe);
    } catch (err) {
        console.error("Error fetching recipe by ID:", err);
        res.status(500).send("Could not retrieve the recipe.");
    }
}

exports.createComment = async (req, res) => {
    const recipe_id = req.params.id;
    const user_id = req.user.id;
    const { parent_comment_id, content } = req.body;

    if (!user_id) {
        return res.status(401).send("User authentication required!");
    }

    if (!content) {
        return res.status(400).send("Comment content is required!");
    }

    try {
        const comment = await RecipeService.createComment(recipe_id, user_id, parent_comment_id, content);
        res.status(201).json(comment.rows[0]);
    } catch (err) {
        console.error("Error creating comment:", err);
        res.status(500).send("Could not create the comment.");
    }
}