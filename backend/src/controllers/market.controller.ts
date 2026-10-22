import { Request, Response } from 'express';
import { marketDataService } from '../services/marketData.service';

export class MarketController {
  public static async getQuotes(req: Request, res: Response) {
    try {
      const quotes = await marketDataService.getAllQuotes();
      return res.json(quotes);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getQuoteBySymbol(req: Request, res: Response) {
    try {
      const symbol = req.params.symbol;
      const quote = await marketDataService.getQuote(symbol);
      return res.json(quote);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getHistoricalBars(req: Request, res: Response) {
    try {
      const symbol = req.params.symbol;
      const timeframe = (req.query.timeframe as string) || '1D';
      const count = parseInt((req.query.count as string) || '60', 10);
      const bars = await marketDataService.getHistoricalBars(symbol, timeframe, count);
      return res.json(bars);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getOrderBook(req: Request, res: Response) {
    try {
      const symbol = req.params.symbol;
      const book = await marketDataService.getOrderBook(symbol);
      return res.json(book);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
