import { users, assets, transactions, prices, dividends, cashMovements, portfolioSnapshots, assetSnapshots } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
export class DatabaseStorage {
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }
    async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || undefined;
    }
    async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }
    async updateUserPortfolioName(userId, portfolioName) {
        await db.update(users).set({ portfolioName }).where(eq(users.id, userId));
    }
    async getAssetsByUserId(userId) {
        return await db.select().from(assets).where(eq(assets.userId, userId));
    }
    async getAsset(id, userId) {
        const [asset] = await db.select().from(assets).where(and(eq(assets.id, id), eq(assets.userId, userId)));
        return asset || undefined;
    }
    async createAsset(asset) {
        const [newAsset] = await db.insert(assets).values(asset).returning();
        return newAsset;
    }
    async updateAsset(id, userId, updates) {
        const [asset] = await db.update(assets)
            .set(updates)
            .where(and(eq(assets.id, id), eq(assets.userId, userId)))
            .returning();
        return asset || undefined;
    }
    async deleteAsset(id, userId) {
        const result = await db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async getTransactionsByUserId(userId) {
        const results = await db.select()
            .from(transactions)
            .innerJoin(assets, eq(transactions.assetId, assets.id))
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.date));
        return results.map(row => ({
            ...row.transactions,
            asset: row.assets
        }));
    }
    async getTransaction(id, userId) {
        const [transaction] = await db.select().from(transactions)
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
        return transaction || undefined;
    }
    async createTransaction(transaction) {
        const [newTransaction] = await db.insert(transactions).values(transaction).returning();
        return newTransaction;
    }
    async updateTransaction(id, userId, updates) {
        const [transaction] = await db.update(transactions)
            .set(updates)
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
            .returning();
        return transaction || undefined;
    }
    async deleteTransaction(id, userId) {
        const result = await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async getPricesByUserId(userId) {
        const results = await db.select()
            .from(prices)
            .innerJoin(assets, eq(prices.assetId, assets.id))
            .where(eq(prices.userId, userId))
            .orderBy(desc(prices.date));
        return results.map(row => ({
            ...row.prices,
            asset: row.assets
        }));
    }
    async getLatestPrices(userId) {
        // Use a window function to get the latest price for each asset based on most recent update
        const latestPrices = await db
            .select({
            id: prices.id,
            userId: prices.userId,
            assetId: prices.assetId,
            date: prices.date,
            closePrice: prices.closePrice,
            createdAt: prices.createdAt,
            assetName: assets.name,
            assetTicker: assets.ticker,
            assetIsin: assets.isin,
            assetCategory: assets.category,
            assetSector: assets.sector,
            assetRegion: assets.region,
            assetCurrency: assets.currency,
            assetUserId: assets.userId,
            assetCreatedAt: assets.createdAt,
            rn: sql `row_number() over (partition by ${prices.assetId} order by ${prices.createdAt} desc)`.as('rn')
        })
            .from(prices)
            .innerJoin(assets, eq(prices.assetId, assets.id))
            .where(eq(prices.userId, userId));
        // Filter to get only the most recent price per asset
        const results = latestPrices
            .filter(row => Number(row.rn) === 1)
            .map(row => ({
            id: row.id,
            userId: row.userId,
            assetId: row.assetId,
            date: row.date,
            closePrice: row.closePrice,
            createdAt: row.createdAt,
            asset: {
                id: row.assetId,
                name: row.assetName,
                ticker: row.assetTicker,
                isin: row.assetIsin,
                category: row.assetCategory,
                sector: row.assetSector,
                region: row.assetRegion,
                currency: row.assetCurrency,
                userId: row.assetUserId,
                createdAt: row.assetCreatedAt,
                notes: null
            }
        }));
        results.forEach(price => {
            console.log(`Latest price for asset ${price.assetId}:`, price.closePrice, 'created at:', price.createdAt);
        });
        return results;
    }
    async getLatestPriceForAsset(assetId, userId) {
        const [priceData] = await db.select()
            .from(prices)
            .where(and(eq(prices.assetId, assetId), eq(prices.userId, userId)))
            .orderBy(sql `${prices.date} desc`)
            .limit(1);
        return priceData || null;
    }
    async createPrice(price) {
        const [newPrice] = await db.insert(prices).values(price).returning();
        return newPrice;
    }
    async updatePrice(id, userId, updates) {
        const [price] = await db.update(prices)
            .set(updates)
            .where(and(eq(prices.id, id), eq(prices.userId, userId)))
            .returning();
        return price || undefined;
    }
    async deletePricesForAsset(assetId, userId) {
        const result = await db.delete(prices).where(and(eq(prices.assetId, assetId), eq(prices.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async getDividendsByUserId(userId) {
        const results = await db.select()
            .from(dividends)
            .innerJoin(assets, eq(dividends.assetId, assets.id))
            .where(eq(dividends.userId, userId))
            .orderBy(desc(dividends.paymentDate));
        return results.map(row => ({
            ...row.dividends,
            asset: row.assets
        }));
    }
    async createDividend(dividend) {
        const [newDividend] = await db.insert(dividends).values(dividend).returning();
        return newDividend;
    }
    async updateDividend(id, userId, updates) {
        const [dividend] = await db.update(dividends)
            .set(updates)
            .where(and(eq(dividends.id, id), eq(dividends.userId, userId)))
            .returning();
        return dividend || undefined;
    }
    async deleteDividend(id, userId) {
        const result = await db.delete(dividends).where(and(eq(dividends.id, id), eq(dividends.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async getCashMovementsByUserId(userId) {
        return await db.select().from(cashMovements)
            .where(eq(cashMovements.userId, userId))
            .orderBy(desc(cashMovements.date));
    }
    async createCashMovement(cashMovement) {
        const [newCashMovement] = await db.insert(cashMovements).values(cashMovement).returning();
        return newCashMovement;
    }
    async updateCashMovement(id, userId, updates) {
        const [cashMovement] = await db.update(cashMovements)
            .set(updates)
            .where(and(eq(cashMovements.id, id), eq(cashMovements.userId, userId)))
            .returning();
        return cashMovement || undefined;
    }
    async deleteCashMovement(id, userId) {
        const result = await db.delete(cashMovements).where(and(eq(cashMovements.id, id), eq(cashMovements.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async getPortfolioOverviewForDate(userId, snapshotDate) {
        // Get all transactions up to the snapshot date
        const transactionSummary = await db
            .select({
            assetId: transactions.assetId,
            totalBought: sql `sum(case when ${transactions.type} = 'buy' then ${transactions.quantity} else 0 end)`.as('total_bought'),
            totalSold: sql `sum(case when ${transactions.type} = 'sell' then ${transactions.quantity} else 0 end)`.as('total_sold'),
            totalBuyValue: sql `sum(case when ${transactions.type} = 'buy' then ${transactions.quantity} * ${transactions.unitPrice} else 0 end)`.as('total_buy_value'),
            totalSellValue: sql `sum(case when ${transactions.type} = 'sell' then ${transactions.quantity} * ${transactions.unitPrice} else 0 end)`.as('total_sell_value'),
            totalBuyFees: sql `sum(case when ${transactions.type} = 'buy' then ${transactions.fees} else 0 end)`.as('total_buy_fees'),
            totalSellFees: sql `sum(case when ${transactions.type} = 'sell' then ${transactions.fees} else 0 end)`.as('total_sell_fees'),
        })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), sql `${transactions.date} <= ${snapshotDate.toISOString().split('T')[0]}`))
            .groupBy(transactions.assetId);
        // Get latest prices before snapshot date using window function
        const latestPricesQuery = await db
            .select({
            assetId: prices.assetId,
            closePrice: prices.closePrice,
            date: prices.date,
            rn: sql `row_number() over (partition by ${prices.assetId} order by ${prices.date} desc, ${prices.createdAt} desc)`.as('rn')
        })
            .from(prices)
            .where(and(eq(prices.userId, userId), sql `${prices.date} <= ${snapshotDate.toISOString().split('T')[0]}`));
        // Filter to get only the most recent price per asset
        const latestPrices = latestPricesQuery.filter(p => Number(p.rn) === 1);
        const priceMap = new Map(latestPrices.map(p => [p.assetId, Number(p.closePrice)]));
        const holdings = [];
        let totalValue = 0;
        let totalInvested = 0;
        const categoryValues = new Map();
        for (const summary of transactionSummary) {
            const quantity = Number(summary.totalBought) - Number(summary.totalSold);
            if (quantity <= 0)
                continue;
            const asset = await this.getAsset(summary.assetId, userId);
            if (!asset)
                continue;
            const currentPrice = Number(priceMap.get(summary.assetId) || 0);
            // Calculate values according to corrected fee handling
            const totalBought = Number(summary.totalBought);
            const totalBuyValue = Number(summary.totalBuyValue);
            const totalBuyFees = Number(summary.totalBuyFees);
            // Average Price: unit price only (no fees)
            const avgPrice = totalBought > 0 ? totalBuyValue / totalBought : 0;
            // Book Value (Total Invested): Net amount paid for current holding
            const bookValue = (quantity * avgPrice) + (totalBuyFees * (quantity / totalBought));
            // Market Value: current price * quantity
            const marketValue = currentPrice * quantity;
            // Unrealized P&L = Market Value - Book Value
            const unrealizedPL = marketValue - bookValue;
            const unrealizedPLPercent = bookValue > 0 ? (unrealizedPL / bookValue) * 100 : 0;
            holdings.push({
                asset,
                quantity,
                avgPrice,
                currentPrice,
                marketValue,
                unrealizedPL,
                unrealizedPLPercent,
                bookValue
            });
            totalValue += marketValue;
            totalInvested += bookValue;
            const currentCategoryValue = categoryValues.get(asset.category) || 0;
            categoryValues.set(asset.category, currentCategoryValue + marketValue);
        }
        const totalPL = totalValue - totalInvested;
        const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
        // Calculate YTD dividends up to snapshot date
        const currentYear = snapshotDate.getFullYear();
        const [ytdResult] = await db
            .select({ total: sql `coalesce(sum(${dividends.amount}), 0)`.as('total') })
            .from(dividends)
            .where(and(eq(dividends.userId, userId), sql `extract(year from ${dividends.paymentDate}) = ${currentYear}`, sql `${dividends.paymentDate} <= ${snapshotDate.toISOString().split('T')[0]}`));
        const ytdDividends = Number(ytdResult?.total || 0);
        // Calculate allocation by category
        const allocationByCategory = Array.from(categoryValues.entries()).map(([category, value]) => ({
            category,
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
        }));
        return {
            totalValue,
            totalInvested,
            totalPL,
            totalPLPercent,
            ytdDividends,
            holdings,
            allocationByCategory
        };
    }
    async getPortfolioOverview(userId) {
        // Get all transactions grouped by asset
        const transactionSummary = await db
            .select({
            assetId: transactions.assetId,
            totalBought: sql `sum(case when ${transactions.type} = 'buy' then ${transactions.quantity} else 0 end)`.as('total_bought'),
            totalSold: sql `sum(case when ${transactions.type} = 'sell' then ${transactions.quantity} else 0 end)`.as('total_sold'),
            // Average price calculation: unit price only, no fees
            totalBuyValue: sql `sum(case when ${transactions.type} = 'buy' then ${transactions.quantity} * ${transactions.unitPrice} else 0 end)`.as('total_buy_value'),
            totalSellValue: sql `sum(case when ${transactions.type} = 'sell' then ${transactions.quantity} * ${transactions.unitPrice} else 0 end)`.as('total_sell_value'),
            // Book value calculation: include fees
            totalBuyFees: sql `sum(case when ${transactions.type} = 'buy' then ${transactions.fees} else 0 end)`.as('total_buy_fees'),
            totalSellFees: sql `sum(case when ${transactions.type} = 'sell' then ${transactions.fees} else 0 end)`.as('total_sell_fees'),
        })
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .groupBy(transactions.assetId);
        // Get latest prices - refresh to ensure we have the most current data
        const latestPrices = await this.getLatestPrices(userId);
        const priceMap = new Map(latestPrices.map(p => [p.assetId, Number(p.closePrice)]));
        const holdings = [];
        let totalValue = 0;
        let totalInvested = 0;
        const categoryValues = new Map();
        // Clean up prices for closed positions first
        for (const summary of transactionSummary) {
            const quantity = Number(summary.totalBought) - Number(summary.totalSold);
            if (quantity <= 0) {
                // Automatically clear current price for closed positions
                await db.delete(prices).where(and(eq(prices.assetId, summary.assetId), eq(prices.userId, userId)));
                continue;
            }
        }
        for (const summary of transactionSummary) {
            const quantity = Number(summary.totalBought) - Number(summary.totalSold);
            if (quantity <= 0)
                continue;
            const asset = await this.getAsset(summary.assetId, userId);
            if (!asset)
                continue;
            // Get current price (manually set price) and calculate values correctly
            const currentPrice = priceMap.get(summary.assetId) || 0;
            console.log(`Asset ${summary.assetId} - Current Price from map:`, currentPrice, 'Quantity:', quantity);
            // Calculate values according to corrected fee handling
            const totalBuyValue = Number(summary.totalBuyValue);
            const totalSellValue = Number(summary.totalSellValue);
            const totalBuyFees = Number(summary.totalBuyFees);
            const totalSellFees = Number(summary.totalSellFees);
            const totalBought = Number(summary.totalBought);
            const totalSold = Number(summary.totalSold);
            // Average Price: unit price only, no fees
            const avgPrice = totalBought > 0 ? totalBuyValue / totalBought : 0;
            // Book Value (Total Invested): Net amount paid for current holding
            // For the current holding quantity, we calculate proportional cost including fees
            const totalNetBuyValue = totalBuyValue + totalBuyFees; // Total cost including buy fees
            const totalNetSellValue = totalSellValue - totalSellFees; // Net cash received from sales
            const bookValue = (quantity * avgPrice) + (totalBuyFees * (quantity / totalBought)); // Cost basis for remaining shares
            // Market Value: Current Price × Quantity
            const marketValue = currentPrice * quantity;
            console.log(`Asset ${summary.assetId} - Market Value calculation:`, currentPrice, '*', quantity, '=', marketValue);
            // Unrealized P&L = Market Value - Book Value
            const unrealizedPL = marketValue - bookValue;
            const unrealizedPLPercent = bookValue > 0 ? (unrealizedPL / bookValue) * 100 : 0;
            holdings.push({
                asset,
                quantity,
                avgPrice,
                currentPrice,
                marketValue,
                unrealizedPL,
                unrealizedPLPercent,
                bookValue
            });
            totalValue += marketValue; // Current market value
            totalInvested += bookValue; // Cost basis (book value)
            const currentCategoryValue = categoryValues.get(asset.category) || 0;
            categoryValues.set(asset.category, currentCategoryValue + marketValue);
        }
        const totalPL = totalValue - totalInvested;
        const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
        // Calculate YTD dividends
        const currentYear = new Date().getFullYear();
        const [ytdResult] = await db
            .select({ total: sql `coalesce(sum(${dividends.amount}), 0)`.as('total') })
            .from(dividends)
            .where(and(eq(dividends.userId, userId), sql `extract(year from ${dividends.paymentDate}) = ${currentYear}`));
        const ytdDividends = Number(ytdResult?.total || 0);
        // Calculate allocation by category
        const allocationByCategory = Array.from(categoryValues.entries()).map(([category, value]) => ({
            category,
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
        }));
        return {
            totalValue,
            totalInvested,
            totalPL,
            totalPLPercent,
            ytdDividends,
            holdings,
            allocationByCategory
        };
    }
    async getDividendsSummary(userId) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        // YTD dividends
        const [ytdResult] = await db
            .select({ total: sql `coalesce(sum(${dividends.amount}), 0)`.as('total') })
            .from(dividends)
            .where(and(eq(dividends.userId, userId), sql `extract(year from ${dividends.paymentDate}) = ${currentYear}`));
        // This month dividends
        const [thisMonthResult] = await db
            .select({ total: sql `coalesce(sum(${dividends.amount}), 0)`.as('total') })
            .from(dividends)
            .where(and(eq(dividends.userId, userId), sql `extract(year from ${dividends.paymentDate}) = ${currentYear}`, sql `extract(month from ${dividends.paymentDate}) = ${currentMonth}`));
        // Average monthly dividends (last 12 months)
        const [avgResult] = await db
            .select({
            total: sql `coalesce(sum(${dividends.amount}), 0)`.as('total'),
            months: sql `count(distinct concat(extract(year from ${dividends.paymentDate}), '-', extract(month from ${dividends.paymentDate})))`.as('months')
        })
            .from(dividends)
            .where(and(eq(dividends.userId, userId), sql `${dividends.paymentDate} >= current_date - interval '12 months'`));
        const ytd = Number(ytdResult?.total || 0);
        const thisMonth = Number(thisMonthResult?.total || 0);
        const avgMonthly = Number(avgResult?.months) > 0
            ? Number(avgResult?.total || 0) / Number(avgResult?.months)
            : 0;
        return {
            ytd,
            thisMonth,
            avgMonthly
        };
    }
    async getClosedPositions(userId) {
        // Get all assets with their transactions ordered by date
        const assetsWithTransactions = await db.select()
            .from(assets)
            .leftJoin(transactions, eq(assets.id, transactions.assetId))
            .where(eq(assets.userId, userId))
            .orderBy(assets.id, transactions.date);
        // Group transactions by asset
        const assetMap = new Map();
        for (const row of assetsWithTransactions) {
            const asset = row.assets;
            const transaction = row.transactions;
            if (!assetMap.has(asset.id)) {
                assetMap.set(asset.id, {
                    asset,
                    transactions: []
                });
            }
            if (transaction) {
                assetMap.get(asset.id).transactions.push(transaction);
            }
        }
        const closedPositions = [];
        // Process each asset to identify independent buy-sell cycles
        for (const [assetId, data] of assetMap) {
            const { asset, transactions: allTransactions } = data;
            // Sort transactions by date and then by ID to ensure proper order
            const sortedTransactions = allTransactions.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateA !== dateB)
                    return dateA - dateB;
                return a.id - b.id; // If same date, sort by ID
            });
            // Track running position and identify closed cycles
            let currentPosition = 0;
            let currentCycleBuys = [];
            let cycleStartDate = null;
            let cycleCount = 0;
            console.log(`Processing ${asset.name} (ID: ${asset.id}) with ${sortedTransactions.length} transactions`);
            for (const transaction of sortedTransactions) {
                const quantity = Number(transaction.quantity);
                console.log(`Processing ${transaction.type}: ${quantity} shares on ${transaction.date} (ID: ${transaction.id})`);
                if (transaction.type === 'buy') {
                    if (currentPosition === 0) {
                        // Starting a new cycle
                        cycleStartDate = transaction.date;
                        currentCycleBuys = [];
                        cycleCount++;
                        console.log(`Starting new cycle ${cycleCount} for ${asset.name}`);
                    }
                    currentCycleBuys.push(transaction);
                    currentPosition += quantity;
                    console.log(`Current position after buy: ${currentPosition}`);
                }
                else if (transaction.type === 'sell') {
                    if (currentPosition > 0 && currentCycleBuys.length > 0) {
                        const sellQuantity = Math.min(quantity, currentPosition);
                        console.log(`Selling ${sellQuantity} shares, current position: ${currentPosition}`);
                        // Calculate proportional buy costs for this sell
                        const totalBoughtInCycle = currentCycleBuys.reduce((sum, t) => sum + Number(t.quantity), 0);
                        // Calculate values for this closed portion
                        const totalBuyValue = currentCycleBuys.reduce((sum, t) => sum + (Number(t.quantity) * Number(t.unitPrice)), 0);
                        const totalBuyFees = currentCycleBuys.reduce((sum, t) => sum + Number(t.fees), 0);
                        // Proportional costs for sold quantity
                        const avgBuyPrice = totalBuyValue / totalBoughtInCycle;
                        const proportionalBuyFees = totalBuyFees * (sellQuantity / totalBoughtInCycle);
                        // Sell values
                        const sellValue = sellQuantity * Number(transaction.unitPrice);
                        const sellFees = Number(transaction.fees) * (sellQuantity / quantity);
                        // Calculate P&L for this cycle portion
                        const cashReceived = sellValue - sellFees;
                        const costPaid = (sellQuantity * avgBuyPrice) + proportionalBuyFees;
                        const realizedPL = cashReceived - costPaid;
                        const realizedPLPercent = costPaid > 0 ? (realizedPL / costPaid) * 100 : 0;
                        const holdingPeriod = Math.floor((new Date(transaction.date).getTime() - new Date(cycleStartDate).getTime()) /
                            (1000 * 60 * 60 * 24));
                        console.log(`P&L calculation: Cash received ${cashReceived} - Cost paid ${costPaid} = ${realizedPL}`);
                        console.log(`Position will be: ${currentPosition - sellQuantity}`);
                        // Create closed position when position will be closed completely
                        const newPosition = currentPosition - sellQuantity;
                        if (newPosition <= 0.001) {
                            console.log(`Creating closed position for ${asset.name} - complete cycle closure`);
                            closedPositions.push({
                                asset,
                                totalBought: currentPosition, // Use current position as total sold
                                totalSold: currentPosition, // All current position was sold
                                avgBuyPrice,
                                avgSellPrice: Number(transaction.unitPrice),
                                realizedPL: realizedPL * (currentPosition / sellQuantity), // Scale P&L to full position
                                realizedPLPercent,
                                holdingPeriod,
                                firstBuyDate: cycleStartDate,
                                lastSellDate: transaction.date,
                                cycleId: `${asset.id}-${cycleCount}-${cycleStartDate}`
                            });
                        }
                        else {
                            console.log(`Not creating closed position - partial sell (${newPosition} remaining)`);
                        }
                        currentPosition = newPosition;
                        console.log(`Position after sell: ${currentPosition}`);
                        // If position is now zero or close to zero, reset for next cycle
                        if (currentPosition <= 0.001) {
                            currentPosition = 0;
                            currentCycleBuys = [];
                            cycleStartDate = null;
                            console.log(`Cycle closed for ${asset.name}, ready for next cycle`);
                        }
                    }
                }
            }
        }
        return closedPositions.sort((a, b) => new Date(b.lastSellDate).getTime() - new Date(a.lastSellDate).getTime());
    }
    async getPortfolioSnapshots(userId) {
        return await db.select().from(portfolioSnapshots)
            .where(eq(portfolioSnapshots.userId, userId))
            .orderBy(desc(portfolioSnapshots.year), desc(portfolioSnapshots.month));
    }
    async createPortfolioSnapshot(snapshot) {
        // Calculate portfolio metrics for the snapshot date
        const snapshotDate = new Date(snapshot.year, snapshot.month - 1); // Convert to Date object
        const currentDate = new Date();
        // For simplicity, always use current portfolio overview for snapshot creation
        // This ensures we capture the current state of holdings with latest prices
        console.log(`Creating snapshot for ${snapshot.month}/${snapshot.year} using current portfolio overview`);
        const overview = await this.getPortfolioOverview(snapshot.userId);
        // Calculate category values and invested amounts from holdings
        const categoryValues = {
            stocks: 0,
            etf: 0,
            crypto: 0,
            bonds: 0
        };
        const categoryInvested = {
            stocks: 0,
            etf: 0,
            crypto: 0,
            bonds: 0
        };
        const categoryDetails = {
            stocks: {},
            etf: {},
            crypto: {},
            bonds: {}
        };
        // Process holdings to calculate category breakdowns
        console.log(`Processing ${overview.holdings.length} holdings for snapshot`);
        console.log(`Overview total value: ${overview.totalValue}, total invested: ${overview.totalInvested}`);
        for (const holding of overview.holdings) {
            const category = holding.asset.category.toLowerCase();
            // Normalize category names to standard 4 categories
            let normalizedCategory = category;
            if (category === 'stock')
                normalizedCategory = 'stocks';
            else if (category === 'fund')
                normalizedCategory = 'bonds';
            console.log(`Asset ${holding.asset.name}: category=${category}, normalized=${normalizedCategory}, quantity=${holding.quantity}, currentPrice=${holding.currentPrice}, marketValue=${holding.marketValue}, bookValue=${holding.bookValue}`);
            if (normalizedCategory in categoryValues) {
                categoryValues[normalizedCategory] += holding.marketValue;
                categoryInvested[normalizedCategory] += holding.bookValue;
                categoryDetails[normalizedCategory][holding.asset.name] = holding.marketValue;
            }
        }
        // Calculate category P&L values
        const categoryPL = {
            stocks: categoryValues.stocks - categoryInvested.stocks,
            etf: categoryValues.etf - categoryInvested.etf,
            crypto: categoryValues.crypto - categoryInvested.crypto,
            bonds: categoryValues.bonds - categoryInvested.bonds
        };
        const categoryPLPercent = {
            stocks: categoryInvested.stocks > 0 ? (categoryPL.stocks / categoryInvested.stocks) * 100 : 0,
            etf: categoryInvested.etf > 0 ? (categoryPL.etf / categoryInvested.etf) * 100 : 0,
            crypto: categoryInvested.crypto > 0 ? (categoryPL.crypto / categoryInvested.crypto) * 100 : 0,
            bonds: categoryInvested.bonds > 0 ? (categoryPL.bonds / categoryInvested.bonds) * 100 : 0
        };
        console.log('Category breakdown for snapshot:');
        console.log('Values:', categoryValues);
        console.log('Invested:', categoryInvested);
        console.log('P&L:', categoryPL);
        console.log('P&L %:', categoryPLPercent);
        const snapshotData = {
            ...snapshot,
            totalValue: overview.totalValue.toString(),
            totalInvested: overview.totalInvested.toString(),
            totalPL: overview.totalPL.toString(),
            totalPLPercent: overview.totalPLPercent.toString(),
            stocksValue: categoryValues.stocks.toString(),
            etfValue: categoryValues.etf.toString(),
            cryptoValue: categoryValues.crypto.toString(),
            bondsValue: categoryValues.bonds.toString(),
            categoryDetails: JSON.stringify({
                ...categoryDetails,
                invested: categoryInvested,
                pl: categoryPL,
                plPercent: categoryPLPercent
            })
        };
        const [newSnapshot] = await db.insert(portfolioSnapshots).values(snapshotData).returning();
        return newSnapshot;
    }
    async updatePortfolioSnapshot(id, userId, updates) {
        const [snapshot] = await db.update(portfolioSnapshots)
            .set(updates)
            .where(and(eq(portfolioSnapshots.id, id), eq(portfolioSnapshots.userId, userId)))
            .returning();
        return snapshot || undefined;
    }
    async deletePortfolioSnapshot(id, userId) {
        const result = await db.delete(portfolioSnapshots).where(and(eq(portfolioSnapshots.id, id), eq(portfolioSnapshots.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async getAssetSnapshots(userId, assetId) {
        return await db.select().from(assetSnapshots)
            .where(and(eq(assetSnapshots.userId, userId), eq(assetSnapshots.assetId, assetId)))
            .orderBy(desc(assetSnapshots.date));
    }
    async createAssetSnapshot(snapshot) {
        const [newSnapshot] = await db.insert(assetSnapshots).values(snapshot).returning();
        return newSnapshot;
    }
    async updateAssetSnapshot(id, userId, updates) {
        const [updatedSnapshot] = await db.update(assetSnapshots)
            .set(updates)
            .where(and(eq(assetSnapshots.id, id), eq(assetSnapshots.userId, userId)))
            .returning();
        return updatedSnapshot;
    }
    async deleteAssetSnapshot(id, userId) {
        const result = await db.delete(assetSnapshots)
            .where(and(eq(assetSnapshots.id, id), eq(assetSnapshots.userId, userId)));
        return (result.rowCount || 0) > 0;
    }
    async generateAssetSnapshots(userId, assetId) {
        // Get asset and its transactions
        const asset = await this.getAsset(assetId, userId);
        if (!asset)
            throw new Error('Asset not found');
        const assetTransactions = await db.select().from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.assetId, assetId)))
            .orderBy(transactions.date);
        // Get all prices for this asset
        const assetPrices = await db.select().from(prices)
            .where(and(eq(prices.userId, userId), eq(prices.assetId, assetId)))
            .orderBy(prices.date);
        if (!assetTransactions.length)
            return [];
        // Build snapshots based on transaction dates and monthly intervals
        const snapshots = [];
        let currentQuantity = 0;
        let totalInvested = 0;
        let transactionIndex = 0;
        // Get date range from first transaction to now
        const startDate = new Date(assetTransactions[0].date);
        const endDate = new Date();
        // Generate monthly snapshots
        let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (currentDate <= endDate) {
            // Process all transactions up to this date
            while (transactionIndex < assetTransactions.length &&
                new Date(assetTransactions[transactionIndex].date) <= currentDate) {
                const transaction = assetTransactions[transactionIndex];
                const quantity = Number(transaction.quantity);
                const unitPrice = Number(transaction.unitPrice);
                const fees = Number(transaction.fees);
                if (transaction.type === 'buy') {
                    currentQuantity += quantity;
                    totalInvested += (quantity * unitPrice) + fees;
                }
                else if (transaction.type === 'sell') {
                    // Calculate proportional cost basis reduction
                    const sellRatio = quantity / currentQuantity;
                    totalInvested *= (1 - sellRatio);
                    currentQuantity -= quantity;
                }
                transactionIndex++;
            }
            // Skip if no position at this date
            if (currentQuantity <= 0) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                continue;
            }
            // Find closest price to this date
            const dateStr = currentDate.toISOString().split('T')[0];
            let closestPrice = assetPrices.find(p => p.date <= dateStr);
            if (!closestPrice && assetPrices.length > 0) {
                closestPrice = assetPrices[assetPrices.length - 1]; // Use latest price
            }
            const currentPrice = closestPrice ? Number(closestPrice.closePrice) : 0;
            const averagePrice = currentQuantity > 0 ? totalInvested / currentQuantity : 0;
            const marketValue = currentQuantity * currentPrice;
            const unrealizedPL = marketValue - totalInvested;
            const unrealizedPLPercent = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;
            const snapshot = {
                userId,
                assetId,
                date: dateStr,
                quantity: currentQuantity.toString(),
                averagePrice: averagePrice.toString(),
                currentPrice: currentPrice.toString(),
                totalCost: totalInvested.toString(),
                marketValue: marketValue.toString(),
                unrealizedPL: unrealizedPL.toString(),
                unrealizedPLPercent: unrealizedPLPercent.toString(),
            };
            snapshots.push(await this.createAssetSnapshot(snapshot));
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return snapshots.reverse(); // Return in chronological order
    }
    async deleteClosedPosition(userId, cycleId) {
        // For simplicity, we'll just return true since closed positions are calculated dynamically
        // In a real implementation, you might want to store cycle IDs and delete related transactions
        return true;
    }
}
// Factory function for tests
export function createStorage() {
    return new DatabaseStorage();
}
export const storage = new DatabaseStorage();
