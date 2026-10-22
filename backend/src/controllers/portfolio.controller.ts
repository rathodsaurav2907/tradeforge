import { Response } from 'express';
import { paperTradingEngine } from '../services/paperTrading.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { DEMO_PORTFOLIO_ID } from '../db/database';

export class PortfolioController {
  public static async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const portfolioId = (req.query.portfolioId as string) || DEMO_PORTFOLIO_ID;
      const summary = await paperTradingEngine.getPortfolioSummary(portfolioId);
      return res.json(summary);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getLedger(req: AuthenticatedRequest, res: Response) {
    try {
      const portfolioId = (req.query.portfolioId as string) || DEMO_PORTFOLIO_ID;
      const ledger = await paperTradingEngine.getLedger(portfolioId);
      return res.json(ledger);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
