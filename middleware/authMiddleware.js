const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Authorization token required.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        // ✅ Verify Access Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            try {
                // ✅ User find करके उसका refresh token उठाओ
                const decodedOld = jwt.decode(token); // Expired token से userId निकाल लो
                const user = await User.findById(decodedOld.userId);

                if (!user || !user.refreshToken) {
                    return res.status(401).json({ success: false, message: "Refresh token missing in DB." });
                }

                // ✅ Verify refresh token (DB वाला)
                const decodedRefresh = jwt.verify(user.refreshToken, process.env.JWT_REFRESH_SECRET);

                // ✅ नया access token बनाओ
                const newAccessToken = jwt.sign(
                    { userId: user._id, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: "1m" }
                );

                // Header में भेज दो
                res.setHeader("x-access-token", newAccessToken);

                req.user = { userId: user._id, role: user.role };
                return next();

            } catch (err) {
                return res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
            }
        } else {
            return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }
    }
};

module.exports = authenticate;
