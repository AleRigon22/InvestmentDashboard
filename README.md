
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
- **SQLite** as lightweight local database

### Deployment
- Optimized for **Replit**
- Compatible with **Vercel**, **Render**, or local Node environments

---

## 📸 Screenshots

> *(You can replace these with your real images once available)*

![Dashboard Overview](./screenshots/dashboard.png)
*Full overview with performance, P/L, and dividend highlights*

![Holdings Page](./screenshots/holdings.png)
*Manage and edit all assets manually*

![Dividends Chart](./screenshots/dividends.png)
*Interactive monthly dividend breakdown*

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

# 4. Start in production mode
npm start

# Or run in development mode
npm run dev
```

---

## 📁 Folder Structure

```bash
client/        # React frontend
server/        # Express + SQLite backend
shared/        # Types and shared utilities
attached_assets/  # Static local screenshots or assets
dist/          # Built files
```

---

## 🧪 Testing

```bash
# Run frontend and backend tests
npm run test
```

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

- Works natively on Replit
- Also exportable to any Node-compatible environment
- Make sure `.env` contains proper database path and secrets

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
