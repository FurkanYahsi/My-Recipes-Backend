function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).send('Unauthorized - Authentication required');
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).send('Forbidden - You do not have permission to access this resource');
    }
    next();
  };
}

module.exports = authorize;