import jwt from "jsonwebtoken";

// Verifies the JWT sent in the Authorization header (format: "Bearer <token>").
// On success, attaches the decoded payload ({ id, role }) to req.user so
// downstream route handlers know who's making the request.
export function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired." });
  }
}

// Restricts a route to specific roles, e.g. requireRole("admin").
// Must be used after `protect`, since it depends on req.user being set.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do that." });
    }
    next();
  };
}
