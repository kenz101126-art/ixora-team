# IXORA TEAM — Production Version

## New features
- MongoDB database persistence
- Secure Admin Login
- Password hashing with bcrypt
- JWT-protected Admin API
- Registration system: Name + Age
- Admin can Approve / Reject / Delete applications
- Persistent community chat
- Responsive premium UI
- IXORA image background
- 3D CSS bicycle animation

## Local setup

### 1. Install Node.js
Download Node.js from the official Node.js website.

### 2. Create a MongoDB Atlas database
Create a free MongoDB Atlas cluster and obtain your connection string.

### 3. Create `.env`
Copy `.env.example` and rename the copy to `.env`.

Example:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_admin_password

Never upload `.env` to GitHub.

### 4. Install packages
npm install

### 5. Start
npm start

Open:
http://localhost:3000

Admin:
http://localhost:3000/admin.html

## Deploy on Render

1. Upload this project to GitHub.
2. Create a Web Service on Render.
3. Build Command:
   npm install
4. Start Command:
   npm start
5. Add Environment Variables on Render:
   MONGODB_URI
   JWT_SECRET
   ADMIN_USERNAME
   ADMIN_PASSWORD

Important: Use a strong password and secret before making the website public.
