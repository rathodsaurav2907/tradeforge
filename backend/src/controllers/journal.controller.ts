import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { inMemoryStore, DEMO_USER_ID, JournalEntry } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class JournalController {
  public static async getEntries(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || DEMO_USER_ID;
    const entries = inMemoryStore.journal
      .filter(j => j.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(entries);
  }

  public static async createEntry(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || DEMO_USER_ID;
    const { 
      symbol, 
      tradeType, 
      entryPrice, 
      exitPrice, 
      quantity, 
      setupTag, 
      notes, 
      emotionalState, 
      rating, 
      pnl, 
      orderId 
    } = req.body;

    if (!symbol || !tradeType || !entryPrice) {
      return res.status(400).json({ error: 'Symbol, trade type, and entry price are required.' });
    }

    const newEntry: JournalEntry = {
      id: uuidv4(),
      userId,
      orderId,
      symbol: symbol.trim().toUpperCase(),
      tradeType: tradeType.toUpperCase() as 'BUY' | 'SELL',
      entryPrice: parseFloat(entryPrice),
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      quantity: quantity ? parseFloat(quantity) : 1,
      setupTag: setupTag || 'Discretionary',
      notes: notes || '',
      emotionalState: emotionalState || 'DISCIPLINED',
      rating: rating ? parseInt(rating, 10) : 4,
      pnl: pnl !== undefined ? parseFloat(pnl) : undefined,
      createdAt: new Date()
    };

    inMemoryStore.journal.push(newEntry);
    return res.status(201).json(newEntry);
  }

  public static async getStats(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || DEMO_USER_ID;
    const entries = inMemoryStore.journal.filter(j => j.userId === userId);

    if (entries.length === 0) {
      return res.json({
        totalLogged: 0,
        winRate: 0,
        averageRating: 0,
        disciplineScore: 100,
        topSetup: 'None'
      });
    }

    const wins = entries.filter(e => (e.pnl || 0) > 0).length;
    const winRate = parseFloat(((wins / entries.length) * 100).toFixed(1));
    const avgRating = parseFloat((entries.reduce((acc, e) => acc + e.rating, 0) / entries.length).toFixed(1));
    const disciplinedCount = entries.filter(e => e.emotionalState === 'DISCIPLINED' || e.emotionalState === 'PATIENT').length;
    const disciplineScore = parseFloat(((disciplinedCount / entries.length) * 100).toFixed(1));

    // Calculate most frequent/profitable setup
    const setupCounts: Record<string, number> = {};
    for (const e of entries) {
      setupCounts[e.setupTag] = (setupCounts[e.setupTag] || 0) + 1;
    }
    const topSetup = Object.keys(setupCounts).sort((a, b) => setupCounts[b] - setupCounts[a])[0] || 'Breakout';

    return res.json({
      totalLogged: entries.length,
      winRate,
      averageRating: avgRating,
      disciplineScore,
      topSetup
    });
  }

  public static async deleteEntry(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const idx = inMemoryStore.journal.findIndex(j => j.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }
    inMemoryStore.journal.splice(idx, 1);
    return res.json({ message: 'Journal entry deleted successfully.' });
  }
}
