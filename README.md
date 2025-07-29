
# 💼 Investment Portfolio Tracker

A production-ready, full-stack web application for tracking personal investments with manual input, historical performance charts, and dividend analysis — inspired by platforms like **Trade Republic** and **Getquin**.

---

## 🚀 Features

- 📊 **Portfolio Dashboard**: Real-time market value, cost basis, total return (P/L), and dividend summary
- 🧾 **Holdings Overview**: All active assets with filters and manual editing
- 📈 **Asset Detail Page**: Historical chart comparing market value vs. invested amount, dividend breakdown
- 💸 **Transaction Management**: Buy/sell tracking with commission fees and date-based sorting
- 🪙 **Dividend Tracker**: Monthly bar chart with asset-colored segments and tooltips
- 💼 **Manual Price Updates**: User-entered current prices to simulate valuation
- 🔐 **Authentication**: Secure login with session-based user separation
- 🌐 **Cloud-native deployment:** React on Vercel, Express backend on Render, DB on Neon
- 🧠 **Fully Local Workflow**: No live APIs; all data entered and updated by the user

---

## 🧱 Tech Stack

### Frontend
- **React** + **TypeScript**
- **Vite** as build tool
- **Tailwind CSS** for responsive design
- **shadcn/ui** component library
- **Recharts** for custom data visualizations
- **TanStack Query** for data fetching and caching

### Backend
- **Express.js** with **TypeScript**
- **Drizzle ORM** for typed SQL access
- **PostgreSQL** (Neon cloud DB, in prod)
- *(Previously used SQLite for local dev — now cloud-native for production)*

### Deployment
- **Frontend:** Vercel
- **Backend/API:** Render.com
- **Database:** Neon.tech (PostgreSQL cloud)
- Fully cross-platform build (`postbuild.js` handles Windows/Linux copy ops)

---

## ⚙️ Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/AleRigon22/InvestmentDashboard.git
cd InvestmentDashboard

# 2. Install dependencies
npm install

# 3. Build server and client
npm run build

# 4. Run postbuild to copy assets (done automatically by build step)
#    Handles both Windows (xcopy) and Linux (cp)

# 5. Add your DB connection string to .env
#    (see section below for format)

# 6. Run database migrations (Drizzle ORM)
npx drizzle-kit push

# 7. Start in production mode (uses .env DATABASE_URL)
npm start

# Or run in development mode
npm run dev
```

---

## 🌐 Deployment Flow

- **Frontend:** Deploy via Vercel (points API requests to backend)
- **Backend:** Deploy via Render.com (serves API & static files)
- **Database:** Neon (PostgreSQL cloud)
- `.env` is used only for local development and **never committed**
- In **Render**, set the `DATABASE_URL` variable in the dashboard Environment section

**Never put your Neon DB string or secrets in the frontend or on Vercel! Only the backend knows the DB.**

---

## 📁 Folder Structure

```bash
client/        # React frontend
server/        # Express + PostgreSQL backend
shared/        # Types and shared utilities (Drizzle schema, etc)
attached_assets/  # Static local screenshots or assets
dist/          # Built files (Vite, server, etc)
dist_public/   # Final static assets for deployment
postbuild.js   # Cross-platform post-build script (handles asset copying)
```

---

## 🧪 Testing

```bash
# Run frontend and backend tests
npm run test
```

---

## 🗄️ Database / Environment

- Uses **PostgreSQL** for production (Neon.cloud)
- `.env` example:
  DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require
- Local development: put your Neon string in `.env`
- Production (Render): add as `DATABASE_URL` Environment Variable

**Migration:**  
Run  
npx drizzle-kit push  
to sync schema to Neon.

---

## 📌 TODOs / Roadmap

- [ ] Optional API price fetching (disabled by design)
- [ ] Advanced analytics (e.g. IRR, CAGR, sector exposure)
- [ ] Export to CSV / PDF
- [ ] Multi-currency support

---

## 🔒 Authentication

- Email + password system
- Session storage using cookies
- Full separation of user-specific portfolios

---

## 🌐 Deployment Notes

- Works natively on Replit (for local dev)
- Frontend deploys to Vercel, backend/API to Render, DB to Neon
- Build process is cross-platform (Windows & Linux via `postbuild.js`)
- Always keep `.env` out of git and frontend!

---

## 📄 License

This project is released under the **MIT License**.

---

## 👨‍💻 Author

Developed by **Alessandro Rigon**  
For professional inquiries or contributions, feel free to reach out via GitHub or LinkedIn.

---

## 🔗 Useful Links

- 🔍 [Live Demo (if deployed)](https://your-demo-link.com)
- 📚 [Drizzle ORM Docs](https://orm.drizzle.team/)
- 🛠 [shadcn/ui](https://ui.shadcn.com/)
- 🐘 [Neon.tech](https://neon.tech/)
- 🟣 [Render.com](https://render.com/)
- ⚡ [Vercel](https://vercel.com/)
