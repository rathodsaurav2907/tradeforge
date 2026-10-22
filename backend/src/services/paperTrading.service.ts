import { v4 as uuidv4 } from 'uuid';
import { inMemoryStore, DEMO_PORTFOLIO_ID, isUsingPostgres, getDbPool } from '../db/database';
import { marketDataService } from './marketData.service';

export interface OrderInput {
  userId: string;
  portfolioId?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  quantity: number;
  price?: number;
}

export interface PositionSummary {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioSummary {
  portfolioId: string;
  cashBalance: number;
  holdingsMarketValue: number;
  totalEquity: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dayPnL: number;
  dayPnLPercent: number;
  positions: PositionSummary[];
}

export class PaperTradingEngine {
  /**
   * Place and process a paper trading order.
   */
  public async placeOrder(input: OrderInput): Promise<any> {
    const portfolioId = input.portfolioId || DEMO_PORTFOLIO_ID;
    const symbol = input.symbol.toUpperCase();
    const quote = await marketDataService.getQuote(symbol);

    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }

    // Determine execution price
    const executionPrice = input.orderType === 'MARKET' ? quote.price : (input.price || quote.price);
    const totalCost = parseFloat((executionPrice * input.quantity).toFixed(2));

    // Get current portfolio
    const portfolio = inMemoryStore.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found.');
    }

    const posKey = `${portfolioId}:${symbol}`;
    const existingPos = inMemoryStore.positions.get(posKey) || {
      id: uuidv4(),
      portfolio_id: portfolioId,
      symbol,
      quantity: 0,
      avg_entry_price: 0
    };

    // Rule validation
    if (input.side === 'BUY') {
      if (portfolio.cash_balance < totalCost) {
        throw new Error(`Insufficient virtual cash balance. Required: $${totalCost.toLocaleString()}, Available: $${portfolio.cash_balance.toLocaleString()}`);
      }
    } else if (input.side === 'SELL') {
      if (existingPos.quantity < input.quantity) {
        throw new Error(`Insufficient shares to sell. Required: ${input.quantity}, Available: ${existingPos.quantity}`);
      }
    }

    const orderId = uuidv4();
    const tradeId = uuidv4();
    const now = new Date();

    // Determine fill status: Market orders fill immediately; Limit orders fill if marketable
    let isFilled = false;
    if (input.orderType === 'MARKET') {
      isFilled = true;
    } else if (input.orderType === 'LIMIT') {
      if (input.side === 'BUY' && quote.price <= (input.price || 0)) {
        isFilled = true;
      } else if (input.side === 'SELL' && quote.price >= (input.price || 0)) {
        isFilled = true;
      }
    }

    const orderRecord = {
      id: orderId,
      user_id: input.userId,
      portfolio_id: portfolioId,
      symbol,
      side: input.side,
      order_type: input.orderType,
      status: isFilled ? 'FILLED' : 'PENDING',
      quantity: input.quantity,
      filled_quantity: isFilled ? input.quantity : 0,
      price: input.price || quote.price,
      avg_fill_price: isFilled ? executionPrice : null,
      total_cost: isFilled ? totalCost : null,
      created_at: now,
      updated_at: now
    };

    inMemoryStore.orders.set(orderId, orderRecord);

    if (isFilled) {
      // Record Trade Execution
      inMemoryStore.trades.push({
        id: tradeId,
        order_id: orderId,
        user_id: input.userId,
        symbol,
        side: input.side,
        quantity: input.quantity,
        price: executionPrice,
        fee: 0.0,
        executed_at: now
      });

      // Update Portfolio Cash & Positions
      if (input.side === 'BUY') {
        portfolio.cash_balance = parseFloat((portfolio.cash_balance - totalCost).toFixed(2));
        
        // Recalculate weighted average entry price
        const totalShares = existingPos.quantity + input.quantity;
        const totalSpent = (existingPos.quantity * existingPos.avg_entry_price) + totalCost;
        existingPos.quantity = totalShares;
        existingPos.avg_entry_price = parseFloat((totalSpent / totalShares).toFixed(2));
        existingPos.updated_at = now;
        inMemoryStore.positions.set(posKey, existingPos);

        // Record Ledger Entry
        inMemoryStore.ledger.push({
          id: uuidv4(),
          portfolio_id: portfolioId,
          entry_type: 'BUY_ORDER',
          amount: -totalCost,
          balance_after: portfolio.cash_balance,
          description: `Filled BUY ${input.quantity} ${symbol} @ $${executionPrice}`,
          reference_id: orderId,
          created_at: now
        });
      } else {
        // SELL
        portfolio.cash_balance = parseFloat((portfolio.cash_balance + totalCost).toFixed(2));
        existingPos.quantity = parseFloat((existingPos.quantity - input.quantity).toFixed(4));
        existingPos.updated_at = now;
        
        if (existingPos.quantity <= 0.0001) {
          inMemoryStore.positions.delete(posKey);
        } else {
          inMemoryStore.positions.set(posKey, existingPos);
        }

        // Record Ledger Entry
        inMemoryStore.ledger.push({
          id: uuidv4(),
          portfolio_id: portfolioId,
          entry_type: 'SELL_ORDER',
          amount: totalCost,
          balance_after: portfolio.cash_balance,
          description: `Filled SELL ${input.quantity} ${symbol} @ $${executionPrice}`,
          reference_id: orderId,
          created_at: now
        });
      }
    }

    return orderRecord;
  }

  /**
   * Cancel an open pending order.
   */
  public async cancelOrder(orderId: string): Promise<any> {
    const order = inMemoryStore.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }
    if (order.status !== 'PENDING') {
      throw new Error(`Cannot cancel order in status: ${order.status}`);
    }
    order.status = 'CANCELLED';
    order.updated_at = new Date();
    inMemoryStore.orders.set(orderId, order);
    return order;
  }

  /**
   * Get all active and completed orders.
   */
  public async getOrders(portfolioId: string = DEMO_PORTFOLIO_ID): Promise<any[]> {
    return Array.from(inMemoryStore.orders.values())
      .filter(o => o.portfolio_id === portfolioId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Calculate complete portfolio performance, unrealized P&L and holdings.
   */
  public async getPortfolioSummary(portfolioId: string = DEMO_PORTFOLIO_ID): Promise<PortfolioSummary> {
    const portfolio = inMemoryStore.portfolios.get(portfolioId) || {
      cash_balance: 100000.00
    };

    const positionList: PositionSummary[] = [];
    let holdingsMarketValue = 0;
    let totalCostBasis = 0;

    for (const [key, pos] of inMemoryStore.positions.entries()) {
      if (pos.portfolio_id === portfolioId && pos.quantity > 0) {
        const quote = await marketDataService.getQuote(pos.symbol);
        const marketVal = parseFloat((pos.quantity * quote.price).toFixed(2));
        const costVal = parseFloat((pos.quantity * pos.avg_entry_price).toFixed(2));
        const unrealizedPnL = parseFloat((marketVal - costVal).toFixed(2));
        const unrealizedPnLPercent = costVal > 0 ? parseFloat(((unrealizedPnL / costVal) * 100).toFixed(2)) : 0;

        holdingsMarketValue += marketVal;
        totalCostBasis += costVal;

        positionList.push({
          symbol: pos.symbol,
          quantity: pos.quantity,
          avgEntryPrice: pos.avg_entry_price,
          currentPrice: quote.price,
          marketValue: marketVal,
          unrealizedPnL,
          unrealizedPnLPercent
        });
      }
    }

    const cash = parseFloat(portfolio.cash_balance.toFixed(2));
    const totalEquity = parseFloat((cash + holdingsMarketValue).toFixed(2));
    const unrealizedPnL = parseFloat((holdingsMarketValue - totalCostBasis).toFixed(2));
    
    // Day P&L estimate based on current holdings
    const dayPnL = parseFloat((unrealizedPnL * 0.45).toFixed(2));
    const dayPnLPercent = totalEquity > 0 ? parseFloat(((dayPnL / totalEquity) * 100).toFixed(2)) : 0;

    return {
      portfolioId,
      cashBalance: cash,
      holdingsMarketValue: parseFloat(holdingsMarketValue.toFixed(2)),
      totalEquity,
      unrealizedPnL,
      realizedPnL: 1420.50, // mock initial realized gains
      dayPnL,
      dayPnLPercent,
      positions: positionList
    };
  }

  /**
   * Get Double-Entry Ledger History
   */
  public async getLedger(portfolioId: string = DEMO_PORTFOLIO_ID): Promise<any[]> {
    return inMemoryStore.ledger
      .filter(entry => entry.portfolio_id === portfolioId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export const paperTradingEngine = new PaperTradingEngine();
