require("dotenv").config();

if(!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

module.exports = {
  port: process.env.AUTH_PORT || 3000,
  mongoURI: process.env.MONGODB_AUTH_URI,
  jwtSecret: process.env.JWT_SECRET,
};