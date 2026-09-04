# StreamX

> **Stream Beyond Limits.**

A modern video streaming platform built with scalability, clean architecture, and real-world backend practices in mind.

> **Status:** 🚧 Currently in Development

## Phase 9 Progress Update

#### ⚡ Redis, Caching & Security Module

Implemented Redis-powered performance optimizations, temporary data storage, rate limiting, and password recovery features to improve the application's scalability, security, and overall backend reliability, including:

- ⚡ Added `Redis` with `ioredis` for fast, centralized temporary data storage
- 🗄️ Added reusable Redis cache utilities for getting, setting, and deleting cached data with TTL support
- 📦 Added Redis caching for channel profile and dashboard/channel data to reduce repeated MongoDB aggregation queries
- 🧹 Added cache invalidation when channel profiles, videos, subscriptions, and dashboard statistics are modified
- 👁️ Added Redis-based video view debouncing using atomic `SET NX EX` operations to prevent repeated views within a 30-minute window
- 🛡️ Added Redis-backed `express-rate-limit` using `rate-limit-redis` for distributed request limiting
- 🔐 Added dedicated authentication rate limiting with a limit of 10 requests per 15 minutes
- 🚫 Added general API rate limiting with a limit of 200 requests per 15 minutes
- 🔑 Added dedicated password-reset rate limiting with a limit of 3 requests per 15 minutes
- 🔐 Added forgot-password functionality using OTP verification
- ⏳ Added Redis-based OTP storage with a 10-minute expiration
- 🔒 Added bcrypt hashing for password-reset OTPs before storing them in Redis
- 📧 Added Nodemailer with Ethereal for development email delivery and OTP testing
- 🛡️ Added protection against email/account enumeration by returning generic password-reset responses
- 🎟️ Added short-lived JWT reset tokens after successful OTP verification
- ♻️ Added one-time OTP invalidation after successful verification
- 🔐 Added password reset functionality with existing session invalidation through refresh-token removal
- 🧯 Added Redis failure handling for cache operations so normal application requests can fall back to MongoDB when caching fails

### Current Status

Phase 9 is successfully completed and all implemented features are working correctly

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Mohammad-Roohullah/StreamX.git

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 📬 API Testing

A complete **Postman Collection** is included in the repository, making it easy to test every implemented API endpoint manually.

Simply import the collection into Postman and configure the required environment variables (such as your base URL and authentication token) to get started.

---

## Vision

StreamX is a production-ready backend project focused on building scalable, secure, and maintainable applications using industry-standard practices.

---

⭐ **Stay tuned—more features are on the way!**