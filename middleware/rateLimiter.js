const rateLimit = require("express-rate-limit");

// Login-specific rate limiter
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 20,                   // 5 requests per IP
    message: {
        status: "fail",
        message: "Too many login attempts. Try again after 5 minutes."
    },
    standardHeaders: true,    // RateLimit-* headers
    legacyHeaders: false      // Disable X-RateLimit-* headers
});

module.exports = loginLimiter;
