const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasRouteAccess, normalizeRoute } = require('../utils/roleAccess');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || req.user.status === 'disabled') {
        return res.status(401).json({ message: 'Not authorized, account unavailable' });
      }
      next();
    } catch {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const requireRouteAccess = (routeName) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no user context' });
  }

  const requestedRoute = normalizeRoute(routeName || `${req.baseUrl || ''}/${req.path || ''}`);
  if (!hasRouteAccess(req.user.role, requestedRoute)) {
    return res.status(403).json({
      message: `Access denied for ${req.user.role}. This route is outside your permitted scope.`
    });
  }

  next();
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, admin access required' });
  }
};

const mentorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'mentor')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, mentor/admin access required' });
  }
};

module.exports = { protect, adminOnly, mentorOrAdmin, requireRouteAccess };
