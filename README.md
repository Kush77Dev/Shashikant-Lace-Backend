# Shashikant Lace - Backend API

Node.js + Express + MongoDB REST API for the Shashikant Lace luxury fabric store.

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (`mongod`) or a MongoDB Atlas connection string

## Setup

```bash
cd "e:\Shashikant Lace Backend"
npm install
```

## Environment Variables

Edit `.env` in this folder:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shashikant_lace
JWT_SECRET=shashikant_lace_jwt_secret_key_2026
CLIENT_URL=http://localhost:5173
```

> For MongoDB Atlas: replace `MONGO_URI` with your Atlas connection string.

## Seed the Database

Populate MongoDB with initial luxury catalog data (products, categories, coupons, testimonials):

```bash
npm run seed
```

## Start the Server

**Development (auto-restart on file changes):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API runs at: `http://localhost:5000`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login & get JWT token |
| GET | `/api/auth/me` | JWT | Get current user |
| PUT | `/api/auth/me` | JWT | Update profile |
| GET | `/api/products` | None | List products (supports ?category=, ?search=) |
| GET | `/api/products/slug/:slug` | None | Get product by slug |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/categories` | None | List categories |
| GET | `/api/collections` | None | List collections |
| GET | `/api/testimonials` | None | List testimonials |
| GET | `/api/coupons` | None | List active coupons |
| POST | `/api/coupons/validate` | None | Validate coupon code |
| POST | `/api/orders` | JWT | Place new order |
| GET | `/api/orders/my` | JWT | Get user's orders |
| GET | `/api/orders/number/:orderNumber` | JWT | Track order by number |
| GET | `/api/cart` | JWT | Get user's cart |
| PUT | `/api/cart` | JWT | Save/update cart |
| GET | `/api/reviews?product_slug=` | None | Get product reviews |
| POST | `/api/reviews` | JWT | Submit a review |

## Make Yourself Admin

After registering, use MongoDB Compass or this command to elevate your user:

```js
// In mongosh
use shashikant_lace
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
