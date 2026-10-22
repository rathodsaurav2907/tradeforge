import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { inMemoryStore, DEMO_USER_ID, WatchlistRecord } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class WatchlistController {
  public static async getWatchlists(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || DEMO_USER_ID;
    const lists = Array.from(inMemoryStore.watchlists.values())
      .filter(w => w.userId === userId);
    return res.json(lists);
  }

  public static async createWatchlist(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || DEMO_USER_ID;
    const { name, description, symbols } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Watchlist name is required.' });
    }

    const id = uuidv4();
    const newWatchlist: WatchlistRecord = {
      id,
      userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      symbols: Array.isArray(symbols) ? symbols.map((s: string) => s.toUpperCase()) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    inMemoryStore.watchlists.set(id, newWatchlist);
    return res.status(201).json(newWatchlist);
  }

  public static async addSymbol(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required.' });
    }

    const list = inMemoryStore.watchlists.get(id);
    if (!list) {
      return res.status(404).json({ error: 'Watchlist not found.' });
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    if (!list.symbols.includes(cleanSymbol)) {
      list.symbols.push(cleanSymbol);
      list.updatedAt = new Date();
      inMemoryStore.watchlists.set(id, list);
    }

    return res.json(list);
  }

  public static async removeSymbol(req: AuthenticatedRequest, res: Response) {
    const { id, symbol } = req.params;

    const list = inMemoryStore.watchlists.get(id);
    if (!list) {
      return res.status(404).json({ error: 'Watchlist not found.' });
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    list.symbols = list.symbols.filter(s => s !== cleanSymbol);
    list.updatedAt = new Date();
    inMemoryStore.watchlists.set(id, list);

    return res.json(list);
  }

  public static async deleteWatchlist(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    if (!inMemoryStore.watchlists.has(id)) {
      return res.status(404).json({ error: 'Watchlist not found.' });
    }
    inMemoryStore.watchlists.delete(id);
    return res.json({ message: 'Watchlist deleted successfully.' });
  }
}
