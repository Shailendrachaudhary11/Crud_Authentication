const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const app = express();  // <-- yeh line sabse pehle honi chahiye
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Public routes
app.use('/api/auth', authRoutes);


// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
