const RecipeService = require('../services/recipeService/RecipeService');
const UserService = require('../services/userService/UserService');
const CommentService = require('../services/commentService/CommentService');

exports.createRecipe = async (req, res) => {
    try {
        const { recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type } = req.body;
        const user_id = req.user.id;

        if (!recipe_name || !recipe_ingredients || !recipe_instructions || !category || !type) {
            return res.status(400).send("Recipe name, ingredients, instructions, category and type are required!");
        }
        
        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }

        const recipe = await RecipeService.createRecipe({ recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type, user_id});

        res.status(201).send("The recipe is shared successfully!");
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("The recipe could not be created.");
    }
};

exports.getRecipeByUserId = async (req, res) => {
    try {
        const user_id = req.user.id;
        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }
        
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        
        const result = await RecipeService.getRecipesByUserId(user_id, limit, offset);
        
        if (result.recipes.length === 0) {
            return res.status(404).send("No recipes found for this user.");
        }
        
        for (let recipe of result.recipes) {
            recipe.is_liked = await RecipeService.checkIfLiked(recipe.id, user_id);
            recipe.is_bookmarked = await RecipeService.checkIfBookmarked(recipe.id, user_id);
            try {
                const user = await UserService.getUserById(recipe.user_id);
                recipe.username = user.username;
            } catch (err) {
                console.error("Error fetching user:", err);
                recipe.user_name = "Anonim";
            }
        }
        
        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching recipes by user ID:", err);
        res.status(500).send("Could not retrieve recipes by user ID.");
    }
};

exports.getTrendRecipes = async (req, res) => {
    try {
        const period = req.params.period;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;
        const result = await RecipeService.getTrendRecipes(period, limit, offset);  
        if (user_id) {
            for (let recipe of result.recipes) {
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
        }
        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching trend recipes:", err);
        res.status(500).send("Could not retrieve trend recipes.");
    }
};

exports.getRecipesByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        const additionalCategories = req.query.categories;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;
        
        let categoryParam;
        
        // If multiple categories are provided, split them
        if (additionalCategories) {
            const extraCategories = additionalCategories.split(',').map(c => c.trim());
            categoryParam = [category, ...extraCategories];
        } else {
            categoryParam = category;
        }
        
        const recipes = await RecipeService.getRecipesByCategory(categoryParam, limit, offset);
        
        // Additional user information and like/bookmark status
        if (user_id) {
            for (let recipe of recipes.recipes) {
                recipe.is_liked = await RecipeService.checkIfLiked(recipe.id, user_id);
                recipe.is_bookmarked = await RecipeService.checkIfBookmarked(recipe.id, user_id);
                
                try {
                    const user = await UserService.getUserById(recipe.user_id);
                    recipe.username = user.username;
                } catch (err) {
                    console.error("Error fetching user:", err);
                    recipe.user_name = "Anonim";
                }
            }
        }
        
        res.status(200).json(recipes);
    } catch (err) {
        console.error("Error fetching recipes by category:", err);
        res.status(500).send("Could not retrieve recipes by category.");
    }
};

exports.getRecipesByType = async (req, res) => {
    try {
        const type = req.params.type;
        const additionalTypes = req.query.types;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;
        let typeParam;

        // If multiple types are provided, split them
        if (additionalTypes) {
            const extraTypes = additionalTypes.split(',').map(t => t.trim());
            typeParam = [type, ...extraTypes];
        } else {
            typeParam = type;
        }
        const recipes = await RecipeService.getRecipesByType(typeParam, limit, offset);
        // Additional user information and like/bookmark status
        if (user_id) {
            for (let recipe of recipes.recipes) {
                recipe.is_liked = await RecipeService.checkIfLiked(recipe.id, user_id);
                recipe.is_bookmarked = await RecipeService.checkIfBookmarked(recipe.id, user_id);
                try {
                    const user = await UserService.getUserById(recipe.user_id);
                    recipe.username = user.username;
                } catch (err) {
                    console.error("Error fetching user:", err);
                    recipe.user_name = "Anonim";
                }
            }
        }
        res.status(200).json(recipes);
    } catch (err) {
        console.error("Error fetching recipes by type:", err);
        res.status(500).send("Could not retrieve recipes by type.");
    }
};

exports.getBookmarkedRecipes = async (req, res) => {
    try {
        const user_id = req.user.id;
        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }
        const recipes = await RecipeService.getBookmarkedRecipes(user_id);
        if (recipes.recipes.length === 0) {
            return res.status(404).send("No bookmarked recipes found.");
        }
        for (let recipe of recipes.recipes) {
            recipe.is_liked = await RecipeService.checkIfLiked(recipe.id, user_id);
            recipe.is_bookmarked = true; // All recipes in this list are bookmarked
            try {
                const user = await UserService.getUserById(recipe.user_id);
                recipe.username = user.username;
            } catch (err) {
                console.error("Error fetching user:", err);
                recipe.user_name = "Anonim";
            }
        }
        res.status(200).json(recipes);
    } catch (err) {
        console.error("Error fetching bookmarked recipes:", err);
        res.status(500).send("Could not retrieve bookmarked recipes.");
    }
};

exports.getLikedRecipes = async (req, res) => {
    try {
        const user_id = req.user.id;
        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }
        
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        
        const recipes = await RecipeService.getLikedRecipes(user_id, limit, offset);
        
        if (recipes.recipes.length === 0) {
            return res.status(404).send("No liked recipes found.");
        }
        
        for (let recipe of recipes.recipes) {
            recipe.is_liked = true; // All recipes in this list are liked
            recipe.is_bookmarked = await RecipeService.checkIfBookmarked(recipe.id, user_id);
            
            try {
                const user = await UserService.getUserById(recipe.user_id);
                recipe.username = user.username;
            } catch (err) {
                console.error("Error fetching user:", err);
                recipe.user_name = "Anonim";
            }
        }
        
        res.status(200).json(recipes);
    } catch (err) {
        console.error("Error fetching liked recipes:", err);
        res.status(500).send("Could not retrieve liked recipes.");
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
        recipe.main_comment_count = await CommentService.getMainCommentCountByRecipeId(recipe_id);

        res.status(200).json(recipe);
    } catch (err) {
        console.error("Error fetching recipe by ID:", err);
        res.status(500).send("Could not retrieve the recipe.");
    }
}

exports.editRecipe = async (req, res) => {
  try {
    const recipe_id = req.params.id;
    const user_id = req.user.id;
    const userRole = req.user.role;
    const { recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type } = req.body;
    
    const existingRecipe = await RecipeService.getRecipeById(recipe_id);
    if (!existingRecipe) {
      return res.status(404).send("Recipe not found");
    }
    
    // Only admin, editor or the recipe owner can edit the recipe
    if (userRole !== 'admin' && userRole !== 'editor' && existingRecipe.user_id !== user_id) {
      return res.status(403).send("You can only edit your own recipes");
    }
    
    const updatedRecipeResult = await RecipeService.updateRecipe(recipe_id, recipe_name, recipe_story, recipe_ingredients, recipe_instructions, category, type);
    
    res.status(200).json({
      message: "Recipe updated successfully",
      recipe: updatedRecipeResult.rows[0]
    });
  } catch (err) {
    console.error("Error updating recipe:", err);
    res.status(500).send("Could not update the recipe");
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe_id = req.params.id;
    const user_id = req.user.id;
    const userRole = req.user.role;
    
    const existingRecipe = await RecipeService.getRecipeById(recipe_id);
    if (!existingRecipe) {
      return res.status(404).send("Recipe not found");
    }
    
    // Only admin, editor or the recipe owner can delete the recipe
    if (userRole !== 'admin' && userRole !== 'editor' && existingRecipe.user_id !== user_id) {
      return res.status(403).send("You can only delete your own recipes");
    }
    
    await RecipeService.deleteRecipe(recipe_id);
    
    res.status(200).send("Recipe deleted successfully");
  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).send("Could not delete the recipe");
  }
};