const UserService = require('../services/userService/UserService');

exports.changeUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    if (!userId || !newRole) {
      return res.status(400).send("User ID and new role are required");
    }
    
    const validRoles = ['user', 'admin', 'editor'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).send(`Invalid role. Role must be one of: ${validRoles.join(', ')}`);
    }
    
    const user = await UserService.changeUserRole(userId, newRole);
    
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    res.status(200).json({
      message: "User role updated successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Error changing user role:", err);
    res.status(500).send("Could not change user role");
  }
};

exports.checkAuth = async (req, res) => {
  try {
    res.status(200).json({ 
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error("Error checking authentication:", err);
    res.status(500).send("Authentication check failed");
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    
    const safeUserList = users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      role: user.role,
      email: user.email,
      created_at: user.created_at
    }));
    
    res.status(200).json(safeUserList);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Could not retrieve users");
  }
};

exports.isUserAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const isAdmin = await UserService.isUserAdmin(userId);

    return res.status(200).json({ isAdmin: isAdmin });
        
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("The operation could not be completed");
  }
};

exports.isUserEditor = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const isEditor = await UserService.isUserEditor(userId);

    return res.status(200).json({ isEditor: isEditor });
        
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("The operation could not be completed");
  }
};