const jwt = require("jsonwebtoken");

const extractBearerToken = (authHeader) => {
  if (!authHeader) {
    return "";
  }
  const parts = String(authHeader).split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return "";
};

const identifyUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ message: "No user id provided" });
  }

  req.userId = userId;
  return next();
};

module.exports = { identifyUser };
