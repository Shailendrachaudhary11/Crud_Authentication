const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const cookieParser = require('cookie-parser');
const helmet = require("helmet");
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const errorHandler = require('./middleware/errorMiddleware');
const logger = require('./config/logger');

const app = express();

// Helmet middleware
app.use(helmet());

// Body parser & cookie parser
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error: ', err));

// Start server
app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
    console.log(`Server running on port ${process.env.PORT}`);
});
