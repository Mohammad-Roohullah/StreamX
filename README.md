# StreamX

> **Stream Beyond Limits.**

A modern video streaming platform built with scalability, clean architecture, and real-world backend practices in mind.

> **Status:** 🚧 Currently in Development

## Phase 9 Progress Update

#### 🔐 Security & Input Validation Module
Implemented security enhancements and request validation to improve the application's protection against common web vulnerabilities and malicious input, including:

- 🛡️ Added `Helmet` for security-focused HTTP response headers
- 🚦 Added `express-rate-limit` for API rate limiting and brute-force protection
- 🔐 Added dedicated authentication rate limiting with a limit of 10 attempts per 15 minutes
- 🚫 Added general API rate limiting with a limit of 200 requests per 15 minutes
- 🧹 Added `express-mongo-sanitize` to help prevent MongoDB injection attacks
- ✅ Added `Zod` for schema-based request validation
- 🧼 Added reusable validation middleware for consistent request validation and error handling
- 🔑 Added validation schemas for user registration and login
- 🛡️ Added `sanitize-html` utility for removing unwanted HTML from user-provided content

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