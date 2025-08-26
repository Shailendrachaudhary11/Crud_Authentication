const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const authenticate = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(new AppError('Authorization token required.', 401));
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        // ✅ Verify Access Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            // Expired access token → handle refresh token
            const decodedOld = jwt.decode(token);
            const user = await User.findById(decodedOld.userId);

            if (!user || !user.refreshToken) {
                return next(new AppError("Refresh token missing in DB.", 401));
            }

            const refreshTokenFromClient = req.cookies?.refreshToken || req.body?.refreshToken;
            if (!refreshTokenFromClient) {
                return next(new AppError("No refresh token provided by client.", 400));
            }

            // ✅ Compare client refresh token with hashed token in DB
            const isValid = await bcrypt.compare(refreshTokenFromClient, user.refreshToken);
            if (!isValid) {
                return next(new AppError("Invalid or expired refresh token.", 401));
            }

            // ✅ Generate new access token
            const newAccessToken = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1m" }
            );

            res.setHeader("x-access-token", newAccessToken);
            req.user = { userId: user._id, role: user.role };
            return next();

        } else {
            return next(new AppError("Invalid or expired token.", 401));
        }
    }
});

module.exports = authenticate;
