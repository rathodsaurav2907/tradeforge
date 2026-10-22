import { Response } from 'express';
import { brokerManager } from '../services/brokers/BrokerManager';
import { riskEngine } from '../services/risk/RiskEngine';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class BrokerController {
  public static async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const mode = brokerManager.getMode();
      const connected = brokerManager.isConnected();
      const brokerName = brokerManager.getActiveBrokerName();
      const riskSettings = riskEngine.getSettings();

      return res.json({
        mode,
        connected,
        brokerName,
        isKillSwitchLocked: riskSettings.isKillSwitchLocked
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async setMode(req: AuthenticatedRequest, res: Response) {
    try {
      const { mode } = req.body;
      if (!['PAPER', 'LIVE'].includes(mode)) {
        return res.status(400).json({ error: 'Mode must be PAPER or LIVE.' });
      }
      const result = brokerManager.setMode(mode);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const { broker, apiKey, apiSecret, accessToken, clientId } = req.body;
      const result = await brokerManager.connectBroker({
        broker: broker || 'ZERODHA',
        apiKey: apiKey || 'demo_api_key',
        apiSecret,
        accessToken,
        clientId: clientId || 'ZR001'
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async getFunds(req: AuthenticatedRequest, res: Response) {
    try {
      const funds = await brokerManager.getFunds();
      return res.json(funds);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getPositions(req: AuthenticatedRequest, res: Response) {
    try {
      const positions = await brokerManager.getPositions();
      return res.json(positions);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getHoldings(req: AuthenticatedRequest, res: Response) {
    try {
      const holdings = await brokerManager.getHoldings();
      return res.json(holdings);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async placeOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol, side, product, orderType, quantity, price, triggerPrice } = req.body;
      const result = await brokerManager.placeLiveOrder({
        symbol: symbol.toUpperCase(),
        exchange: 'NSE',
        side: side.toUpperCase(),
        product: product || 'MIS',
        orderType: orderType || 'MARKET',
        quantity: parseInt(quantity, 10),
        price: price ? parseFloat(price) : undefined,
        triggerPrice: triggerPrice ? parseFloat(triggerPrice) : undefined
      });
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async squareOffPosition(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol, product, quantity } = req.body;
      const result = await brokerManager.squareOffPosition(symbol, product, quantity);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async triggerKillSwitch(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await brokerManager.executeKillSwitch();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getRiskSettings(req: AuthenticatedRequest, res: Response) {
    return res.json(riskEngine.getSettings());
  }

  public static async updateRiskSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const updated = riskEngine.updateSettings(req.body);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public static async unlockKillSwitch(req: AuthenticatedRequest, res: Response) {
    riskEngine.unlockKillSwitch();
    return res.json({ message: 'Emergency Kill-Switch has been unlocked. Live orders can be placed again.' });
  }
}
