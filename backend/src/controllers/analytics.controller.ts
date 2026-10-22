import { Request, Response } from 'express';
import { analyticsClientService } from '../services/analyticsClient.service';
import { paperTradingEngine } from '../services/paperTrading.service';
import { DEMO_PORTFOLIO_ID } from '../db/database';

export class AnalyticsController {
  public static async getSignals(req: Request, res: Response) {
    try {
      const symbol = req.params.symbol;
      const signals = await analyticsClientService.getSignals(symbol);
      return res.json(signals);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getIndicators(req: Request, res: Response) {
    try {
      const symbol = req.params.symbol;
      const indicators = await analyticsClientService.getIndicators(symbol);
      return res.json(indicators);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getPortfolioRisk(req: Request, res: Response) {
    try {
      const portfolioId = (req.query.portfolioId as string) || DEMO_PORTFOLIO_ID;
      const summary = await paperTradingEngine.getPortfolioSummary(portfolioId);
      const risk = await analyticsClientService.getPortfolioRisk(summary.positions, summary.cashBalance);
      return res.json(risk);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
