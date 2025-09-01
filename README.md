# CRUD App with Authentication
A Node.js and Express.js application that provides CRUD functionality with user authentication, JWT-based login, password hashing, email verification, and file upload support. 
MongoDB is used as the database.

#Features

User registration with hashed passwords (bcryptjs)

User login with JWT tokens
Password reset via email and OTP
Create, read, update, delete posts (CRUD)
Like/dislike posts and add comments
Upload profile pictures and files
Redis caching for faster queries
Centralized error handling and logging (winston)
Secure headers with helmet

#Tech Stack

Backend: Node.js, Express.js
Database: MongoDB (Mongoose ODM)
Authentication: JWT, bcryptjs
Email & SMS: Nodemailer, Twilio
Caching: Redis
Logging: Winston
Environment Management: dotenv
