# Investment Portfolio Tracker

A production-ready, full-stack web application for managing personal investment portfolios with manual data entry, comprehensive tracking, and historical analysis.

## Features

- **Portfolio Management**: Track stocks, ETFs, funds, and cryptocurrency holdings
- **Transaction Recording**: Buy/sell transactions with fee calculation
- **Price Updates**: Manual current price entry with automatic portfolio valuation
- **Dividend Tracking**: Record and analyze dividend payments over time
- **Cash Management**: Track deposits and withdrawals
- **Historical Analysis**: Portfolio snapshots and performance charts
- **User Authentication**: Secure login with session-based authentication
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for server state management
- **Recharts** for data visualization
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication
- **bcrypt** for password hashing

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/portfolio
   SESSION_SECRET=your-secret-key
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Testing

Run the test suite:

```bash
# Backend tests
npm run test

# Frontend tests  
npm run test:frontend

# All tests
npm run test:all

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage

The testing infrastructure includes:
- **Backend**: Jest unit and integration tests for storage and authentication
- **Frontend**: React Testing Library tests for key components
- **Coverage**: Minimum 80% coverage target for critical paths

## Database Schema

The application uses 6 main tables:
- `users` - User accounts and authentication
- `assets` - Investment assets (stocks, ETFs, funds, crypto)
- `transactions` - Buy/sell transaction history
- `prices` - Manual price updates per asset
- `dividends` - Dividend payment records
- `cash_movements` - Cash deposits and withdrawals
- `portfolio_snapshots` - Historical portfolio data

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Portfolio Management
- `GET /api/assets` - Get user's assets
- `POST /api/assets` - Create new asset
- `GET /api/transactions` - Get user's transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/portfolio/overview` - Portfolio summary and metrics
- `GET /api/portfolio/closed-positions` - Closed position history

## Development

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript schemas
├── __tests__/       # Test files
└── dist/           # Production build output
```

### Building for Production

```bash
npm run build
npm start
```

## Recent Improvements

### January 2025
- ✅ **Automated Testing**: Added Jest unit/integration tests for backend and React Testing Library tests for frontend
- ✅ **Enhanced User Experience**: Fixed login redirect, current price updates, and history visualization
- ✅ **Accessibility**: Added dialog descriptions to resolve accessibility warnings
- ✅ **Independent Closed Positions**: Fixed position tracking to handle separate buy-sell cycles
- ✅ **Enhanced Fee Handling**: Corrected fee calculations for accurate P&L reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License