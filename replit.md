# Investment Portfolio Tracker

## Overview

This is a production-ready, full-stack web application that allows multiple private investors to record, track, and monitor their personal investment portfolios. The application supports manual entry of stock, ETF, fund, and crypto holdings, buy/sell transactions, monthly price updates, dividend payments, and cash movements. Each user has a private and independent portfolio protected by login credentials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts library for data visualization
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Session Storage**: express-session with PostgreSQL session store

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Database Schema (6 Tables)
1. **users**: User accounts with authentication credentials
2. **assets**: Master list of investment assets (stocks, ETFs, funds, crypto)
3. **transactions**: Buy/sell transaction history per user
4. **prices**: Manually entered current price updates per asset
5. **dividends**: Dividend payment records per user
6. **cash_movements**: Cash deposits and withdrawals per user

### Recent Changes (January 2025)
- **Comprehensive Asset Detail Page UI/UX Enhancement with Mobile Optimization (Latest, January 27, 2025)**:
  - **Contextual Button Functionality**: Fixed top buttons (Edit Asset, Add Transaction, Add Dividend) to pre-fill with current asset data and disable asset selection dropdown
  - **Enhanced KPI Blocks with Tooltips**: Added informative tooltips to all metrics explaining calculations, improved mobile responsiveness with 2x3 grid layout
  - **Advanced Chart Improvements**: Fixed tooltip labeling (Invested Value vs Market Value), added always-visible legend, currency formatting for Y-axis, and optional percentage view toggle
  - **Asset Sold Status Banner**: Added prominent orange banner when asset is fully sold with sale date and closure confirmation
  - **Color-Coded Transaction History**: Enhanced sorting (newest first), blue BUY/red SELL badges, added transaction summary row showing Total Invested/Sold/Realized P&L
  - **Mobile-First Design with Tabs**: Implemented Performance/Transactions/Notes tabs for mobile screens with horizontal scrollable charts and optimized layouts
  - **Enhanced Personal Notes System**: Added strategy tag selector (Long-term, Growth, Passive Income, etc.), improved UI with timestamps and file icons
  - **Accessibility Improvements**: Added tooltips for all icons and abbreviations, color indicators for positive/negative performance, proper visual hierarchy
  - **Mobile Chart Optimization**: Horizontally scrollable charts, compressed time range buttons, responsive legends and controls
- **Asset Detail Page Chart Removal and Stabilization (January 28, 2025)**:
  - **Complete Chart Code Removal**: Systematically removed all Investment Performance chart-related imports, components, state variables, and JSX fragments from asset detail page
  - **Application Stability Restoration**: Fixed multiple JSX syntax errors and hanging code fragments that were causing compilation failures and application crashes
  - **Clean Mobile/Desktop Structure**: Removed chart code from both mobile tabs and desktop layout sections, maintaining clean page structure
  - **Variable Cleanup**: Eliminated all references to undefined variables (chartViewMode, timeRange, performanceData, rawPerformanceData) that were causing runtime errors
  - **Preserved Functional Components**: Maintained all working components including KPI blocks, transaction history, personal notes, and dividend chart sections
  - **Ready for Fresh Implementation**: Created clean slate structure ready for new Investment Performance chart implementation with proper data accuracy from Historical Snapshots
- **Complete Asset Detail Page Overhaul with Fixed Calculations and Enhanced UI (January 27, 2025)**:
  - **Fixed KPI Calculations**: Corrected all financial calculations with proper decimal number conversion from PostgreSQL, eliminating NaN errors and ensuring accurate metrics
  - **2x3 KPI Layout**: Restructured metrics display - Row 1: Total Invested (with portfolio weight %), Quantity Held, Market Value; Row 2: Average Buy Price, Realized P&L, Unrealized P&L
  - **Enhanced Performance Chart**: Added fallback message for insufficient data, improved data generation with proper starting points and current value projection
  - **Improved Transaction Table**: Added Net Total column showing fees-adjusted amounts, fixed total calculations using quantity × unit price, proper currency formatting
  - **Functional Modal Integration**: Connected Edit Asset, Add Transaction, and Add Dividend buttons to existing modal components with pre-filled asset data
  - **Enhanced Personal Notes**: Added emoji icon, timestamp display, improved UI with better spacing and auto-save functionality
  - **Closed Position Indicators**: Added holding duration badges for fully sold assets, proper status tags and period calculations
  - **Portfolio Weight Display**: Shows percentage of total portfolio value for better context and allocation awareness
  - **Mobile Responsive Design**: Ensured all components stack properly on mobile devices with proper overflow handling
- **Dashboard KPI Layout Redesign and Dynamic Chart Coloring (January 27, 2025)**:
  - **Two-Row KPI Layout**: Reorganized KPI cards into logical groupings - Row 1: Total Value, Cost Basis, Total Dividends (3 cards), Row 2: Total P&L, Realized P&L, Unrealized P&L (3 cards)
  - **Interactive Tooltips**: Added proper hover/tap tooltips for all KPI metrics with detailed explanations of each calculation
  - **Dynamic Asset Coloring**: Implemented HSL-based color generation for individual assets in pie charts, creating distinct colors for each asset while maintaining category-based base colors
  - **Responsive Grid Layout**: Maintains equal spacing and alignment across all screen sizes with proper mobile stacking
  - **Chart Tooltip Disambiguation**: Fixed naming conflicts between UI tooltips and chart tooltips for proper functionality
  - **Enhanced User Experience**: Improved visual hierarchy and information density without overwhelming the interface
- **Enhanced Trades Page with Advanced Transaction Analysis (January 26, 2025)**:
  - **Fees Column**: Added dedicated column showing transaction fees with Banknote icons, displaying "–" for zero fees
  - **Realized P&L for Sells**: Shows both absolute value (+€41.00) and percentage (+372.73%) with green/red color coding for gains/losses
  - **Asset Type Icons**: Added category-specific icons next to asset names for quick visual identification (stocks, crypto, ETFs, bonds)
  - **Comprehensive Filtering**: Search by asset name/ticker, filter by transaction type (Buy/Sell), and filter by asset category
  - **Advanced Sorting**: Clickable column headers for Date, Asset Name, Quantity, and Amount with visual sort indicators
  - **Enhanced Transaction Rows**: Added hover effects, improved spacing, and tooltips for unit price information
  - **Right-Aligned Numericals**: All monetary values and quantities properly aligned for better readability
  - **Transaction Counter**: Shows filtered vs total transaction count for better user awareness
  - **Mobile Responsive**: All new features maintain full mobile compatibility with horizontal scrolling
- **Advanced Holdings Page Enhancements (January 26, 2025)**:
  - **Accordion-Style Category Grouping**: Implemented collapsible sections for Stocks, ETFs, Crypto, and Bonds with color-coded icons and consistent styling
  - **Expandable Asset Rows**: Added individual asset expansion showing detailed transaction history in FIFO order with buy/sell badges, dates, and fee information
  - **Total Cost Column**: Added new column displaying total investment cost (Quantity × Average Price) alongside market value for better cost basis tracking
  - **Fee Indicators with Tooltips**: Added dollar sign icons for assets with fees, showing total fees paid on hover with detailed tooltips
  - **Enhanced Closed Positions**: Restructured closed positions with category-based accordion grouping matching open positions structure
  - **Mini Sparkline Charts**: Integrated lightweight performance visualization showing individual asset value progression over time
  - **Comprehensive Sorting**: Added sorting controls for Market Value, % Return, Asset Name, and Quantity with visual indicators
  - **Improved Mobile Responsiveness**: All accordion sections and expanded details maintain full mobile compatibility
- **Clean Dashboard Layout with Fixed Structure (January 25, 2025)**:
  - **4-Card Top Row**: Streamlined to essential metrics only - Total Value, Cost Basis, P&L, and Total Dividends in clean horizontal layout
  - **Full-Width Portfolio Performance Chart**: Moved chart immediately below top cards spanning full width with time range selector (3M, 6M, YTD, Max)
  - **Three Allocation Charts Grid**: Asset Allocation (with center portfolio value), Stocks/ETFs/Bonds Allocation (individual holdings breakdown), and Crypto Holdings distribution
  - **Removed Redundant Metrics**: Eliminated unnecessary cards (Paid Fees, Assets Up/Down, Total Assets, Closed Trades) for cleaner focus
  - **Fixed Chart Titles**: Renamed to "Stocks / ETFs / Bonds Allocation" with proper individual asset breakdown and color-coded legends
  - **Consistent Layout Hierarchy**: Top cards → Performance chart → Allocation charts → Top/Bottom Performers → Recent Transactions
  - **Eliminated Duplicates**: Removed duplicate Portfolio Performance and Asset Allocation charts for clean, non-redundant layout
- **Unified Header Design and Custom Color System**:
  - **Consistent Header Layout**: Unified all page headers (Dashboard, Holdings, Trades, Dividends, History) with identical structure, height, and spacing
  - **Custom Page Icon Colors**: Applied distinct colors to each page icon - Dashboard (blue #3B82F6), Holdings (green #10B981), Trades (amber #F59E0B), Dividends (violet #8B5CF6), History (red #EF4444)
  - **Chart-Consistent Section Icons**: Updated Holdings page asset category icons to match chart colors - Stocks (#3B82F6), ETFs (#22C55E), Crypto (#F97316), Bonds/Funds (#A855F7)
  - **Dashboard Layout Restructure**: Moved "Welcome back, [username]" message to subtitle position below portfolio title for consistency with other pages
  - **Responsive Design**: All header updates maintain full mobile responsiveness across all device sizes
- **UI/UX Improvements and Graph Enhancements**:
  - **Simplified Current Price Editing**: Removed dedicated price modal; current price now directly editable by clicking in Holdings table
  - **Clean Accordion Design**: Removed hover effects and blue backgrounds from snapshot category rows for consistent white background
  - **Zero Value Display**: Categories with no assets now properly show 0 values instead of fake placeholders
  - **Functional Time Range Selector**: Fixed graph dropdown with 3M, 6M, YTD, Max options that properly filter data and auto-scale Y-axis
  - **Login Flow Enhancement**: Users automatically redirect to Dashboard after successful login instead of Holdings page
  - **Improved Y-axis Scaling**: Charts start at €0 and dynamically scale to data maximum for better visualization
- **Comprehensive Asset Categorization System**:
  - **Standardized 4-Category System**: Implemented stocks, ETF, crypto, and bonds/funds categories with consistent colors and icons
  - **Enhanced Database Schema**: Added category breakdown fields to portfolio snapshots table with detailed JSON storage
  - **Categorized Holdings Page**: Redesigned Holdings page with visual grouping by asset categories and color-coded sections
  - **Updated History Visualization**: Enhanced History page charts with standardized category colors and improved legend display
  - **Comprehensive Storage Support**: Added automatic category value calculation and storage for historical snapshots
  - **Visual Consistency**: Standardized category colors, icons, and display names throughout the entire application
- **Automated Testing Infrastructure**:
  - **Jest Backend Testing**: Added comprehensive unit and integration tests for storage and authentication modules
  - **React Testing Library**: Created frontend component tests for login and holdings pages
  - **Test Coverage**: Configured 80% minimum coverage threshold for critical code paths
  - **Test Scripts**: Added npm scripts for running tests, watch mode, and coverage reports
  - **Mock Infrastructure**: Set up proper mocking for React components, hooks, and API calls
- **Major Portfolio Improvements (Latest)**:
  - **Independent Closed Positions**: Fixed closed positions to track separate buy-sell cycles instead of cumulative totals
  - **Enhanced Fee Handling**: Corrected fee calculations where buy fees increase total cost and sell fees reduce cash received
  - **Custom Delete Confirmations**: Replaced system alerts with professional modal confirmations for transaction deletion
  - **Visual Separation**: Added clear separator between open and closed positions in Holdings page
  - **Sell All Functionality**: Added "Sell All" quick-action button in sell transaction modal with auto-fill of current price
  - **Dashboard Refresh Fix**: Snapshot saving now immediately refreshes dashboard graphs and KPIs
  - **New History Section**: Complete historical tracking with monthly performance graphs and data tables
  - **Enhanced Navigation**: Added History page to bottom navigation replacing Cash section
- **Previous Fee Handling Correction**: Fixed transaction fee calculation logic for accurate P&L
  - Average Price: Now calculated from unit price only, fees excluded for proper averaging
  - Book Value: Fees correctly deducted from total invested (buy fees) and cash received (sell fees)
  - Realized P&L: Cash received minus cost paid, properly accounting for fees
  - Applied to both portfolio overview and closed positions calculations
- **Portfolio Snapshot System**: Added manual historical data entry with month/year selection for backtesting
- **Enhanced Holdings Page**: Added asset icons, category-specific colors, and interactive action buttons
- **Interactive Price Updates**: Current Price is clickable for quick updates in Holdings table
- **Portfolio Customization**: Added portfolio title editing with pencil icon functionality
- **Enhanced Dividend Management**: 
  - Replaced ex-date field with notes field for better flexibility
  - Implemented edit and delete functionality for dividend entries
  - Added stacked bar chart showing asset contribution breakdown per month
- **Asset Form Improvements**: 
  - Added dropdown selections for sectors (11 predefined Italian sectors)
  - Added dropdown selections for geographical regions (5 predefined areas)
- **UI/UX Enhancements**:
  - Limited edit modal height to 75% viewport with scroll for better usability
  - Added color-coded asset badges throughout the interface for consistency

### Authentication System
- Session-based authentication using Passport.js
- Secure password hashing with bcrypt
- User isolation - each user can only access their own data
- Login/register endpoints with validation

### API Endpoints
- Authentication: `/api/auth/*` (login, register, logout, current user)
- Assets: `/api/assets` (CRUD operations for investment assets)
- Transactions: `/api/transactions` (CRUD operations for trades)
- Prices: `/api/prices` (manual price entry and updates)
- Dividends: `/api/dividends` (dividend tracking and summaries)
- Cash Movements: `/api/cash-movements` (deposits and withdrawals)
- Portfolio Analytics: `/api/portfolio/overview` (calculated portfolio metrics)

### Frontend Components
- **Pages**: Dashboard, Holdings, Transactions, Dividends, Cash, Login
- **Charts**: Portfolio value over time, asset allocation, dividend history
- **Modals**: Add transaction, add dividend, add cash movement forms
- **Navigation**: Bottom navigation bar for mobile-friendly experience
- **UI Components**: Complete shadcn/ui component library integration

## Data Flow

1. **User Authentication**: Users log in through session-based authentication
2. **Manual Data Entry**: Users manually enter all investment data (no real-time feeds)
3. **Portfolio Calculations**: Backend calculates portfolio metrics from user data
4. **Real-time Updates**: Frontend uses React Query for optimistic updates and cache management
5. **Data Visualization**: Charts display portfolio performance and asset allocation

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-kit for database operations
- **Authentication**: passport, passport-local, express-session, connect-pg-simple
- **UI Components**: @radix-ui/* components with class-variance-authority
- **Charts**: recharts for data visualization
- **Validation**: zod for schema validation
- **Forms**: react-hook-form with @hookform/resolvers

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full TypeScript setup with strict configuration
- **Styling**: Tailwind CSS with PostCSS
- **Dev Tools**: Replit-specific plugins for development environment

## Deployment Strategy

### Development
- Uses Vite dev server with HMR for fast development
- Replit-specific middleware for development banner and cartographer
- Environment variables for database connection and session secrets

### Production Build
- Frontend: Vite builds React app to static files in `dist/public`
- Backend: esbuild bundles Express server to `dist/index.js`
- Database: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Session encryption key (defaults provided for development)
- `NODE_ENV`: Environment flag for production/development behavior

### File Structure
- `client/`: React frontend application
- `server/`: Express backend API
- `shared/`: Shared TypeScript schemas and types
- `migrations/`: Database migration files generated by Drizzle

The application follows a clean separation of concerns with the frontend handling user interactions and data visualization, while the backend manages authentication, data validation, and business logic calculations.