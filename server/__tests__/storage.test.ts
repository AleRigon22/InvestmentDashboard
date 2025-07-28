import { describe, test, expect, beforeEach } from '@jest/globals';
import { createStorage } from '../storage';

describe('Storage Service', () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
  });

  describe('User Management', () => {
    test('should create and retrieve a user', async () => {
      const userData = {
        username: 'testuser',
        passwordHash: 'hashedpassword123',
        portfolioName: 'Test Portfolio'
      };

      const user = await storage.createUser(userData);
      expect(user).toHaveProperty('id');
      expect(user.username).toBe('testuser');
      expect(user.portfolioName).toBe('Test Portfolio');

      const retrievedUser = await storage.getUser(user.id);
      expect(retrievedUser).toEqual(user);
    });

    test('should find user by username', async () => {
      const userData = {
        username: 'findme',
        passwordHash: 'hashedpassword123',
        portfolioName: 'Find Me Portfolio'
      };

      const user = await storage.createUser(userData);
      const foundUser = await storage.getUserByUsername('findme');
      
      expect(foundUser).toEqual(user);
    });

    test('should return null for non-existent user', async () => {
      const user = await storage.getUserByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });

  describe('Asset Management', () => {
    let userId: number;

    beforeEach(async () => {
      const user = await storage.createUser({
        username: 'assetuser',
        passwordHash: 'hashedpassword123',
        portfolioName: 'Asset Portfolio'
      });
      userId = user.id;
    });

    test('should create and retrieve assets', async () => {
      const assetData = {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        category: 'stock' as const,
        sector: 'Technology',
        region: 'Stati Uniti',
        currency: 'USD'
      };

      const asset = await storage.createAsset({ ...assetData, userId });
      expect(asset).toHaveProperty('id');
      expect(asset.name).toBe('Apple Inc.');
      expect(asset.ticker).toBe('AAPL');
      expect(asset.userId).toBe(userId);

      const assets = await storage.getAssetsByUserId(userId);
      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual(asset);
    });

    test('should update asset', async () => {
      const asset = await storage.createAsset({
        name: 'Apple Inc.',
        ticker: 'AAPL',
        category: 'stock' as const,
        sector: 'Technology',
        region: 'Stati Uniti',
        currency: 'USD',
        userId
      });

      const updatedAsset = await storage.updateAsset(asset.id, userId, {
        name: 'Apple Inc. (Updated)',
        ticker: 'AAPL',
        category: 'stock' as const,
        sector: 'Technology',
        region: 'Stati Uniti',
        currency: 'USD'
      });

      expect(updatedAsset?.name).toBe('Apple Inc. (Updated)');
    });
  });

  describe('Transaction Management', () => {
    let userId: number;
    let assetId: number;

    beforeEach(async () => {
      const user = await storage.createUser({
        username: 'transactionuser',
        passwordHash: 'hashedpassword123',
        portfolioName: 'Transaction Portfolio'
      });
      userId = user.id;

      const asset = await storage.createAsset({
        name: 'Test Stock',
        ticker: 'TEST',
        category: 'stock' as const,
        sector: 'Technology',
        region: 'Stati Uniti',
        currency: 'USD',
        userId
      });
      assetId = asset.id;
    });

    test('should create and retrieve transactions', async () => {
      const transactionData = {
        assetId,
        type: 'buy' as const,
        quantity: '100',
        unitPrice: '50.00',
        fees: '2.50',
        date: '2024-01-15'
      };

      const transaction = await storage.createTransaction({ ...transactionData, userId });
      expect(transaction).toHaveProperty('id');
      expect(transaction.type).toBe('buy');
      expect(transaction.quantity).toBe('100');
      expect(transaction.userId).toBe(userId);

      const transactions = await storage.getTransactionsByUserId(userId);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe(transaction.id);
    });

    test('should delete transaction', async () => {
      const transaction = await storage.createTransaction({
        assetId,
        type: 'buy' as const,
        quantity: '100',
        unitPrice: '50.00',
        fees: '2.50',
        date: '2024-01-15',
        userId
      });

      const success = await storage.deleteTransaction(transaction.id, userId);
      expect(success).toBe(true);

      const transactions = await storage.getTransactionsByUserId(userId);
      expect(transactions).toHaveLength(0);
    });
  });
});