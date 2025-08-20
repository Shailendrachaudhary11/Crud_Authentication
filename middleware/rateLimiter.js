const rateLimit = require('express-rate-limit');

// Login-specific rate limiter
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 5,                    // max 5 login attempts per IP
    message: "Too many login attempts. Try again after 5 minutes."
});

module.exports =  loginLimiter  ;
