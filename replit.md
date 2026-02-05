# TathaGat - CAT Coaching Platform

## Overview
A full-stack web application for TathaGat, a CAT/XAT/SNAP exam coaching platform. The application provides study materials, mock tests, course management, and student tracking features.

## Project Structure
- `frontend/` - React.js application (Create React App)
- `backend/` - Express.js API server
- `attached_assets/` - Static assets and images

## Technology Stack
- **Frontend**: React 18, React Router, Chart.js, Framer Motion, Tailwind-style components
- **Backend**: Express.js, Mongoose (MongoDB ODM)
- **Database**: MongoDB (external - requires MONGO_URI environment variable)
- **Payment**: Razorpay integration

## Running the Application

### Development
- **Frontend**: Runs on port 5000 (`cd frontend && npm start`)
- **Backend**: Runs on port 3001 (`cd backend && npm run dev`)

The frontend proxies `/api` and `/uploads` requests to the backend on port 3001.

### Required Environment Variables
- `MONGO_URI` - MongoDB connection string
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API key secret
- `JWT_SECRET` - JWT signing secret

### Default Admin Credentials (auto-created on first run)
- Email: admin@gmail.com
- Password: Admin@123

## Architecture
- Frontend uses Create React App with setupProxy.js to proxy API calls
- Backend is a REST API with Mongoose models
- Authentication via JWT tokens
- File uploads handled via Multer

## Recent Changes
- 2026-02-05: Initial Replit environment setup
  - Configured frontend to run on port 5000 with host checks disabled
  - Backend runs on port 3001
  - Set up both workflows for development
