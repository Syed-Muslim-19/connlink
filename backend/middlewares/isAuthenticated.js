import jwt from "jsonwebtoken";
const isAuthenticated = async (req, res, next) => {
  try {
    console.log("🟡 Auth middleware: Starting authentication");

    // Check for token in cookies first
    let token = req.cookies.token;

    // If no cookie token, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log("🟡 Auth middleware: Using Bearer token");
      }
    } else {
      console.log("🟡 Auth middleware: Using cookie token");
    }

    if (!token) {
      console.log("🔴 Auth middleware: No token provided");
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    // Verify the token
    const decode = jwt.verify(token, process.env.SECRET_KEY);

    if (!decode || !decode.userId) {
      console.log("🔴 Auth middleware: Invalid token payload");
      return res.status(401).json({ message: "Invalid token", success: false });
    }

    console.log("🟢 Auth middleware: Authenticated user:", decode.userId);
    req.id = decode.userId;
    next();
  } catch (error) {
    console.log("🔴 Auth middleware error:", error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token", success: false });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired", success: false });
    }
    
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};
export default isAuthenticated;
