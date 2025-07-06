// middleware/auth.js
// Temporary placeholder while JWT is disabled

// This simply passes the request through without checking any token
const authenticateToken = (req, res, next) => {
  // Simulate authenticated user if needed (for testing roles)
  req.user = {
    user_id: 1,
    username: 'admin1',
    role: 'admin'
  };
  next();
};

// Optional: basic role check middleware
/*const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
*/