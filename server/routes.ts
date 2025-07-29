import type { Express } from "express";
import session from 'express-session';
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import { insertUserSchema, insertAssetSchema, insertTransactionSchema, insertPriceSchema, insertDividendSchema, insertCashMovementSchema, insertPortfolioSnapshotSchema, insertAssetSnapshotSchema } from "../shared/schema.js";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

import session from 'express-session';

export async function registerRoutes(app: express.Express) {
  // ─────── SESSIONE ───────
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in environment variables.");
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 settimana
      },
    })
  );
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(new LocalStrategy(
    async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const { username, password } = validatedData;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, passwordHash });
      
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Registration failed' });
        }
        res.json({ user: { id: user.id, username: user.username, portfolioName: user.portfolioName } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username, portfolioName: user.portfolioName } });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username, portfolioName: user.portfolioName } });
  });

  app.put('/api/auth/portfolio-name', requireAuth, async (req, res) => {
    try {
      const { portfolioName } = req.body;
      const user = req.user as any;
      
      await storage.updateUserPortfolioName(user.id, portfolioName);
      res.json({ message: "Portfolio name updated successfully" });
    } catch (error) {
      console.error("Portfolio name update error:", error);
      res.status(500).json({ message: "Failed to update portfolio name" });
    }
  });

  // Assets routes
  app.get('/api/assets', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const assets = await storage.getAssetsByUserId(user.id);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assets' });
    }
  });

  app.post('/api/assets', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const assetData = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset({ ...assetData, userId: user.id });
      res.json(asset);
    } catch (error) {
      res.status(400).json({ message: 'Invalid asset data' });
    }
  });

  app.put('/api/assets/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertAssetSchema.partial().parse(req.body);
      const asset = await storage.updateAsset(id, user.id, updates);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      res.json(asset);
    } catch (error) {
      res.status(400).json({ message: 'Invalid asset data' });
    }
  });

  app.patch('/api/assets/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      
      // Simple validation for notes field
      if (typeof notes !== 'string' && notes !== null && notes !== undefined) {
        return res.status(400).json({ message: 'Notes must be a string' });
      }
      
      const asset = await storage.updateAsset(id, user.id, { notes });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      res.json(asset);
    } catch (error) {
      console.error('Asset notes update error:', error);
      res.status(500).json({ message: 'Failed to update asset notes' });
    }
  });

  app.delete('/api/assets/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const success = await storage.deleteAsset(id, user.id);
      if (!success) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete asset' });
    }
  });

  // Transactions routes
  app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transactions = await storage.getTransactionsByUserId(user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      console.log('Transaction request body:', req.body);
      const transactionData = insertTransactionSchema.parse(req.body);
      console.log('Validated transaction data:', transactionData);
      const transaction = await storage.createTransaction({ ...transactionData, userId: user.id });
      res.json(transaction);
    } catch (error) {
      console.error('Transaction creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid transaction data', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(400).json({ message: 'Invalid transaction data' });
    }
  });

  app.put('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, user.id, updates);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: 'Invalid transaction data' });
    }
  });

  app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id, user.id);
      if (!success) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete transaction' });
    }
  });

  // Prices routes
  app.get('/api/prices', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const prices = await storage.getPricesByUserId(user.id);
      res.json(prices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch prices' });
    }
  });

  app.post('/api/prices', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      console.log('Price request body:', req.body);
      const priceData = insertPriceSchema.parse(req.body);
      console.log('Validated price data:', priceData);
      
      // Delete any existing price for this asset and user to ensure clean slate
      await storage.deletePricesForAsset(priceData.assetId, user.id);
      console.log(`Deleted existing prices for asset ${priceData.assetId}`);
      
      // Create new price entry
      const price = await storage.createPrice({ ...priceData, userId: user.id });
      console.log('Created fresh price:', price);
      
      res.json(price);
    } catch (error) {
      console.error('Price creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid price data', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(400).json({ message: 'Invalid price data' });
    }
  });

  app.put('/api/prices/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertPriceSchema.partial().parse(req.body);
      const price = await storage.updatePrice(id, user.id, updates);
      if (!price) {
        return res.status(404).json({ message: 'Price not found' });
      }
      res.json(price);
    } catch (error) {
      res.status(400).json({ message: 'Invalid price data' });
    }
  });

  // Dividends routes
  app.get('/api/dividends', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const dividends = await storage.getDividendsByUserId(user.id);
      res.json(dividends);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dividends' });
    }
  });

  app.post('/api/dividends', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      console.log('Dividend request body:', req.body);
      
      const validatedData = {
        assetId: parseInt(req.body.assetId),
        paymentDate: req.body.paymentDate,
        amount: req.body.amount,
        notes: req.body.notes || '',
      };
      
      console.log('Validated dividend data:', validatedData);
      const dividend = await storage.createDividend({ ...validatedData, userId: user.id });
      res.json(dividend);
    } catch (error) {
      console.error('Dividend creation error:', error);
      res.status(400).json({ message: 'Invalid dividend data' });
    }
  });

  app.put('/api/dividends/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertDividendSchema.partial().parse(req.body);
      const dividend = await storage.updateDividend(id, user.id, updates);
      if (!dividend) {
        return res.status(404).json({ message: 'Dividend not found' });
      }
      res.json(dividend);
    } catch (error) {
      res.status(400).json({ message: 'Invalid dividend data' });
    }
  });

  app.delete('/api/dividends/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const success = await storage.deleteDividend(id, user.id);
      if (!success) {
        return res.status(404).json({ message: 'Dividend not found' });
      }
      res.json({ message: 'Dividend deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete dividend' });
    }
  });

  // Cash movements routes
  app.get('/api/cash-movements', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const cashMovements = await storage.getCashMovementsByUserId(user.id);
      res.json(cashMovements);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch cash movements' });
    }
  });

  app.post('/api/cash-movements', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const cashMovementData = insertCashMovementSchema.parse(req.body);
      const cashMovement = await storage.createCashMovement({ ...cashMovementData, userId: user.id });
      res.json(cashMovement);
    } catch (error) {
      res.status(400).json({ message: 'Invalid cash movement data' });
    }
  });

  app.put('/api/cash-movements/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertCashMovementSchema.partial().parse(req.body);
      const cashMovement = await storage.updateCashMovement(id, user.id, updates);
      if (!cashMovement) {
        return res.status(404).json({ message: 'Cash movement not found' });
      }
      res.json(cashMovement);
    } catch (error) {
      res.status(400).json({ message: 'Invalid cash movement data' });
    }
  });

  app.delete('/api/cash-movements/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const success = await storage.deleteCashMovement(id, user.id);
      if (!success) {
        return res.status(404).json({ message: 'Cash movement not found' });
      }
      res.json({ message: 'Cash movement deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete cash movement' });
    }
  });

  // Portfolio overview route
  app.get('/api/portfolio/overview', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const overview = await storage.getPortfolioOverview(user.id);
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch portfolio overview' });
    }
  });

  // Dividends summary route
  app.get('/api/dividends/summary', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const summary = await storage.getDividendsSummary(user.id);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dividends summary' });
    }
  });

  // Closed positions route
  app.get('/api/portfolio/closed-positions', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const closedPositions = await storage.getClosedPositions(user.id);
      res.json(closedPositions);
    } catch (error) {
      console.error('Error fetching closed positions:', error);
      res.status(500).json({ message: 'Failed to fetch closed positions' });
    }
  });

  app.delete('/api/portfolio/closed-positions/:cycleId', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      await storage.deleteClosedPosition(user.id, req.params.cycleId);
      res.json({ message: 'Closed position deleted successfully' });
    } catch (error) {
      console.error('Error deleting closed position:', error);
      res.status(500).json({ message: 'Failed to delete closed position' });
    }
  });

  // Portfolio snapshots routes
  app.get('/api/portfolio/snapshots', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const snapshots = await storage.getPortfolioSnapshots(user.id);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch portfolio snapshots' });
    }
  });

  app.post('/api/portfolio/snapshots', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const snapshotData = insertPortfolioSnapshotSchema.parse(req.body);
      const snapshot = await storage.createPortfolioSnapshot({ ...snapshotData, userId: user.id });
      res.json(snapshot);
    } catch (error) {
      console.error('Portfolio snapshot creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid snapshot data', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(400).json({ message: 'Invalid snapshot data' });
    }
  });

  app.put('/api/portfolio/snapshots/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertPortfolioSnapshotSchema.partial().parse(req.body);
      const snapshot = await storage.updatePortfolioSnapshot(id, user.id, updates);
      if (!snapshot) {
        return res.status(404).json({ message: 'Portfolio snapshot not found' });
      }
      res.json(snapshot);
    } catch (error) {
      console.error('Error updating portfolio snapshot:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid snapshot data', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(500).json({ message: 'Failed to update portfolio snapshot' });
    }
  });

  app.delete('/api/portfolio/snapshots/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const success = await storage.deletePortfolioSnapshot(id, user.id);
      if (!success) {
        return res.status(404).json({ message: 'Portfolio snapshot not found' });
      }
      res.json({ message: 'Portfolio snapshot deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete portfolio snapshot' });
    }
  });

  // Asset snapshots routes
  app.get('/api/assets/:assetId/snapshots', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const assetId = parseInt(req.params.assetId);
      const snapshots = await storage.getAssetSnapshots(user.id, assetId);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch asset snapshots' });
    }
  });

  app.post('/api/assets/:assetId/snapshots', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const assetId = parseInt(req.params.assetId);
      const snapshotData = insertAssetSnapshotSchema.parse(req.body);
      const snapshot = await storage.createAssetSnapshot({ ...snapshotData, userId: user.id, assetId });
      res.json(snapshot);
    } catch (error) {
      console.error('Asset snapshot creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid snapshot data', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(400).json({ message: 'Invalid snapshot data' });
    }
  });

  app.post('/api/assets/:assetId/snapshots/generate', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const assetId = parseInt(req.params.assetId);
      const snapshots = await storage.generateAssetSnapshots(user.id, assetId);
      res.json(snapshots);
    } catch (error) {
      console.error('Asset snapshot generation error:', error);
      res.status(500).json({ message: 'Failed to generate asset snapshots' });
    }
  });

  app.put('/api/assets/:assetId/snapshots/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const updates = insertAssetSnapshotSchema.partial().parse(req.body);
      const snapshot = await storage.updateAssetSnapshot(id, user.id, updates);
      if (!snapshot) {
        return res.status(404).json({ message: 'Asset snapshot not found' });
      }
      res.json(snapshot);
    } catch (error) {
      console.error('Error updating asset snapshot:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid snapshot data', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(500).json({ message: 'Failed to update asset snapshot' });
    }
  });

  app.delete('/api/assets/:assetId/snapshots/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssetSnapshot(id, user.id);
      if (!success) {
        return res.status(404).json({ message: 'Asset snapshot not found' });
      }
      res.json({ message: 'Asset snapshot deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete asset snapshot' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}