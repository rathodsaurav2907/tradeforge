import { Request, Response } from 'express';
import { analyticsClientService } from '../services/analyticsClient.service';
import { paperTradingEngine } from '../services/paperTradingEngine.service';
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

  public static async getSmartScore(req: Request, res: Response) {
    try {
      const symbol = (req.params.symbol || 'RELIANCE').trim().toUpperCase();
      const signals = await analyticsClientService.getSignals(symbol);
      const rawScore = Math.round(((signals.momentum_score + 100) / 2) * 0.7 + (signals.confidence * 0.3));
      const score = Math.max(0, Math.min(100, rawScore));

      const label = score >= 75 ? 'Strong Buy'
        : score >= 60 ? 'Buy'
        : score >= 45 ? 'Hold'
        : score >= 25 ? 'Caution'
        : 'Sell';

      return res.json({
        symbol,
        score,
        label,
        trend: signals.trend,
        confidence: signals.confidence,
        momentum: signals.momentum_score,
        summary: signals.reasons?.[0] || 'Market signal evaluation based on live technical and momentum analysis.'
      });
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
