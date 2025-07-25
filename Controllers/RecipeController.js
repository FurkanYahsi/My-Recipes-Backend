const RecipeService = require('../services/recipeService/RecipeService');
const UserService = require('../services/userService/UserService'); 

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
        
        res.status(200).json(recipes);
    } catch (err) {
        console.error("Error fetching recipes by popularity:", err);
        res.status(500).send("Could not retrieve recipes.");
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
            for (let recipe of recipes) {
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
            for (let recipe of recipes) {
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
        recipe.main_comment_count = await RecipeService.getMainCommentCountByRecipeId(recipe_id);

        res.status(200).json(recipe);
    } catch (err) {
        console.error("Error fetching recipe by ID:", err);
        res.status(500).send("Could not retrieve the recipe.");
    }
}


exports.createComment = async (req, res) => {
    const recipe_id = req.params.id;
    const user_id = req.user.id;
    const { parent_comment_id, content, root_comment_id } = req.body;

    if (!user_id) {
        return res.status(401).send("User authentication required!");
    }

    if (!content) {
        return res.status(400).send("Comment content is required!");
    }

    try {
        const comment = await RecipeService.createComment(recipe_id, user_id, parent_comment_id, content, root_comment_id);
        res.status(201).json(comment.rows[0]);
    } catch (err) {
        console.error("Error creating comment:", err);
        res.status(500).send("Could not create the comment.");
    }
}

exports.getComments = async (req, res) => {
    try {
        const recipe_id = req.params.id;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;

        if (!recipe_id) {
            return res.status(400).send("Recipe ID is required!");
        }

        const comments = await RecipeService.getMainCommentsByRecipeId(recipe_id, limit, offset);
        
        if (user_id) {
            for (let comment of comments) {
                comment.is_liked = await RecipeService.checkIfCommentLiked(comment.id, user_id);
                
                try {
                    const user = await UserService.getUserById(comment.user_id);
                    comment.username = user.username;
                    comment.user_name = user.name;
                    comment.user_surname = user.surname;
                } catch (err) {
                    console.error("Error fetching user for comment:", err);
                }
            }
        }
        
        res.status(200).json(comments);
    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).send("Could not retrieve comments.");
    }
};

exports.getCommentReplies = async (req, res) => {
    try {
        const parent_id = req.params.id;
        const limit = parseInt(req.query.limit || '10');
        const user_id = req.user?.id;

        if (!parent_id) {
            return res.status(400).send("Parent comment ID is required!");
        }

        const replies = await RecipeService.getRepliesByParentCommentId(parent_id, limit);
        
        if (user_id) {
            for (let reply of replies) {
                reply.is_liked = await RecipeService.checkIfCommentLiked(reply.id, user_id);
                
                try {
                    const user = await UserService.getUserById(reply.user_id);
                    reply.username = user.username;
                    reply.user_name = user.name;
                    reply.user_surname = user.surname;
                } catch (err) {
                    console.error("Error fetching user for reply:", err);
                }
            }
        }
        
        res.status(200).json(replies);
    } catch (err) {
        console.error("Error fetching comment replies:", err);
        res.status(500).send("Could not retrieve comment replies.");
    }
};

exports.getRootCommentReplies = async (req, res) => {
    try {
        const root_comment_id = req.params.id;
        const limit = parseInt(req.query.limit || '10');
        const page = parseInt(req.query.page || '1');
        const offset = (page - 1) * limit;
        const user_id = req.user?.id;

        if (!root_comment_id) {
            return res.status(400).send("Root comment ID is required!");
        }

        const replies = await RecipeService.getRepliesByRootCommentId(root_comment_id, limit, offset);
        
        // Kullanıcı giriş yapmışsa beğeni durumunu kontrol et
        if (user_id) {
            for (let reply of replies) {
                reply.is_liked = await RecipeService.checkIfCommentLiked(reply.id, user_id);
                
                try {
                    const user = await UserService.getUserById(reply.user_id);
                    reply.username = user.username;
                    reply.user_name = user.name;
                    reply.user_surname = user.surname;
                } catch (err) {
                    console.error("Error fetching user for reply:", err);
                }
            }
        }
        
        res.status(200).json(replies);
    } catch (err) {
        console.error("Error fetching root comment replies:", err);
        res.status(500).send("Could not retrieve replies.");
    }
};

exports.likeOrUnlikeComment = async (req, res) => {
    try {
        const comment_id = req.params.id;
        const user_id = req.user.id;

        if (!user_id) {
            return res.status(401).send("User authentication required!");
        }

        const liked = await RecipeService.checkIfCommentLiked(comment_id, user_id);
        
        if (liked) {
            await RecipeService.unlikeComment(comment_id, user_id);
            res.status(200).json({ liked: false, message: "Comment unliked successfully!" });
        } else {
            await RecipeService.likeComment(comment_id, user_id);
            res.status(200).json({ liked: true, message: "Comment liked successfully!" });
        }
    } catch (err) {
        console.error("Error toggling comment like:", err);
        res.status(500).send("Could not process the comment like/unlike action.");
    }
};