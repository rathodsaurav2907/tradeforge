import { Response } from 'express';
import { paperTradingEngine } from '../services/paperTrading.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { DEMO_USER_ID, DEMO_PORTFOLIO_ID } from '../db/database';

export class OrdersController {
  public static async placeOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || DEMO_USER_ID;
      const { symbol, side, orderType, quantity, price, portfolioId } = req.body;

      const order = await paperTradingEngine.placeOrder({
        userId,
        portfolioId: portfolioId || DEMO_PORTFOLIO_ID,
        symbol,
        side,
        orderType,
        quantity,
        price
      });

      return res.status(201).json({
        message: order.status === 'FILLED' ? 'Order executed and filled successfully' : 'Limit order placed in order book',
        order
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async cancelOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const cancelled = await paperTradingEngine.cancelOrder(id);
      return res.json({ message: 'Order cancelled successfully', order: cancelled });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const portfolioId = (req.query.portfolioId as string) || DEMO_PORTFOLIO_ID;
      const orders = await paperTradingEngine.getOrders(portfolioId);
      return res.json(orders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
