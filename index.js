const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const errorHandler = require('./middleware/errorMiddleware'); // <-- error handler import

const app = express();  // <-- yeh line sabse pehle honi chahiye
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Error handler
app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
