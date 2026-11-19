# ShopOnline - Full-Stack E-commerce App

ShopOnline is a full-stack online store. It has two parts:

- a **Next.js 15 (React 19, TypeScript, Tailwind CSS 4)** frontend
- an **Express 5 + MongoDB (Mongoose)** REST API backend

Shoppers can browse products, open a product page, read and post reviews, see the discounted products on the deals page, sign up, log in and add items to a cart.

---

## Quick start

```bash
git clone https://github.com/Mian-Basam/Ecommerce.git
cd Ecommerce
chmod +x run.sh

# 1. Configure the backend (MongoDB URI + JWT secret)
cp Ecommerce/shop-online-backend/.env.example Ecommerce/shop-online-backend/.env
#    then edit Ecommerce/shop-online-backend/.env

# 2. First run: install, seed the DB with sample data, start everything
./run.sh --seed

# Later runs
./run.sh
```

Open **http://localhost:3000**. The API runs at **http://localhost:5000**.

If you skip step 1, `run.sh` copies both `.env.example` files for you. The backend example points at a local MongoDB on `mongodb://127.0.0.1:27017/shop-online`.

### `run.sh` options

| Command | What it does |
|---|---|
| `./run.sh` | Installs dependencies if they're missing, then starts the backend and the frontend in dev mode |
| `./run.sh --seed` | Same, but loads the sample data into MongoDB first. It's safe to re-run: existing users, products and deals are skipped (it adds 50 more sample reviews each time) |
| `./run.sh --prod` | Builds the frontend and serves it with `next start` |
| `FRONTEND_PORT=3001 ./run.sh` | Uses a different frontend port |

Press **Ctrl+C** to stop both servers.

---

## Prerequisites

- **Node.js 18.18+** (tested on v20 and v22)
- **MongoDB**: a local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Project structure

```
.
├── run.sh                       # one-command install / seed / start
├── Dockerfile                   # Ubuntu + Node 22 image with deps preinstalled
└── Ecommerce/
    ├── shop-online-backend/     # Express REST API
    │   ├── server.js            # app entry: middleware, DB connect, routes
    │   ├── lib/
    │   │   ├── dbConnect.js     # mongoose.connect(MONGO_URI)
    │   │   └── dbInit.js        # seed script (users, products, deals, reviews)
    │   ├── models/              # Mongoose schemas
    │   │   ├── Users.js         # name, email, password (bcrypt-hashed), role
    │   │   ├── Product.js       # name, brand, category, price, stock, image, rating…
    │   │   ├── Deal.js          # originalPrice, discountPercentage, dealPrice…
    │   │   ├── Review.js        # userId, productId, rating 1-5, comment
    │   │   ├── Cart.js          # (schema only - not used by routes yet)
    │   │   └── Order.js         # (schema only - not used by routes yet)
    │   ├── api/auth/
    │   │   ├── userRoutes.js    # /api/user/signup, /api/user/login
    │   │   ├── productRouters.js# /api/products…
    │   │   └── [...nextauth].js # unused NextAuth config (not wired into Express)
    │   ├── data/                # seed JSON: users, products (48), deals (28)
    │   └── .env.example
    └── shop-online-frontend/    # Next.js App Router frontend
        ├── public/              # logos, icons, product images by category
        └── src/app/
            ├── layout.tsx       # Navbar, Footer, toasts, User + Cart providers
            ├── page.tsx         # Home: hero slider + featured product grid
            ├── product/[id]/    # product details, reviews, add-to-cart
            ├── deals/           # discounted products
            ├── login/ signup/   # auth forms
            ├── about/ contact/  # static pages
            ├── list/            # placeholder page (search results target)
            ├── not-found.tsx    # custom 404
            ├── components/      # Navbar, Slider, ProductList, CartModal, SearchBar…
            └── context/
                ├── UserContext.tsx  # isLoggedIn (based on JWT in localStorage)
                └── CartContext.tsx  # in-memory cart with toast notifications
```

---

## How it works

### Backend (`Ecommerce/shop-online-backend`)

`server.js` turns on CORS and JSON body parsing, connects to MongoDB, and mounts two routers:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/signup` | Body: `{ name, email, password }`. Creates a user (the password is hashed with bcrypt in a Mongoose `pre('save')` hook). Returns 400 if the email already exists |
| `POST` | `/api/user/login` | Body: `{ email, password }`. Returns `{ token, user }`. The token is a JWT that expires after 7 days |
| `GET` | `/api/products?skip=0&limit=20` | Newest products first, paginated |
| `GET` | `/api/products/deals` | All deals, each with `price` (original), `dealPrice` and `discountPercentage` |
| `GET` | `/api/products/:id` | `{ product, reviews }`. Each review includes the reviewer's name |
| `POST` | `/api/products/:id/reviews` | Body: `{ rating, comment }`. Saves the review and updates the product's average `rating` and `numReviews` |

**Environment variables** (`.env`):

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `PORT` | API port (default `5000`) |

**Seeding:** `node lib/dbInit.js`, or `./run.sh --seed`. The script inserts 20 users, 48 products and 28 deals, skipping any that already exist (users are matched by email, products and deals by name). It also adds 50 random reviews. Seeded users' passwords are the plain values in `data/users.json`, e.g. `alice.johnson@example.com` / `hashedpassword1`, and they are bcrypt-hashed on insert.

### Frontend (`Ecommerce/shop-online-frontend`)

- Every API call uses `process.env.NEXT_PUBLIC_API_BASE` (set in `.env.local`). Because it's a `NEXT_PUBLIC_` variable, its value is **baked in at build time**: if you change it, rebuild.
- **Home**: an animated hero slider (Framer Motion) and a product grid that loads 10 products at a time.
- **Product page** (`/product/[id]`): shows details, stock and rating, lets you pick a quantity and add to the cart, and has a review list and review form.
- **Deals** (`/deals`): shows the discounted price next to the original.
- **Auth**: login stores the JWT in `localStorage`, and `UserContext` reads it on page load to show or hide Login/Logout.
- **Cart**: `CartContext` keeps the cart in React state, and the cart icon in the navbar opens `CartModal`.
- Images are served from `public/<category>/…`, and their paths are stored in the seed data.

---

## Running the pieces manually

```bash
# Backend
cd Ecommerce/shop-online-backend
npm install
cp .env.example .env        # then edit
node lib/dbInit.js          # optional: seed
npm run dev                 # nodemon, or: npm start

# Frontend (in another terminal)
cd Ecommerce/shop-online-frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
# production:
npm run build && npm start
```

### Docker

The `Dockerfile` builds an Ubuntu 20.04 image with Node 22 and both projects' dependencies already installed:

```bash
docker build -t shop-online .
docker run -it -p 3000:3000 -p 5000:5000 \
  -e MONGO_URI="<your-uri>" -e JWT_SECRET="<secret>" \
  shop-online bash
# inside the container:
./run.sh
```

Inside a container, `localhost` refers to the container itself, so `MONGO_URI` must point to MongoDB Atlas or to a MongoDB host the container can reach.

---

## Known limitations / ideas for improvement

- **The cart isn't saved.** It lives in React state and is lost on page refresh. "Checkout" only shows an alert. The `Cart` and `Order` models exist but no routes use them yet.
- **Reviews are anonymous.** No auth middleware checks the JWT on API routes, so new reviews are stored with `userId: null`.
- **The search bar** sends you to `/list?name=…`, but `/list` is still a placeholder page.
- **The navbar's "Shop" link** goes to `/shop`, which doesn't exist yet (you'll see the 404 page).
- **Unused pieces:** the Stripe packages are installed but not used yet, and `api/auth/[...nextauth].js` isn't connected to Express.
- **About the seed data:** prices are on different scales across categories (for example, makeup is around 1,299 and bags around 79.99), so mixed currencies show up side by side.

---

## Tech stack

**Frontend:** Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Axios, react-toastify, react-icons
**Backend:** Node.js, Express 5, Mongoose 8, bcrypt, jsonwebtoken, dotenv, cors
