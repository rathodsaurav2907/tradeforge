import { IBrokerAdapter, BrokerCredentials, LiveOrderInput, LiveOrderResult } from './IBrokerAdapter';
import { ZerodhaKiteAdapter } from './ZerodhaKiteAdapter';
import { riskEngine } from '../risk/RiskEngine';
import { marketDataService } from '../marketData.service';

export type ExecutionMode = 'PAPER' | 'LIVE';

export class BrokerManager {
  private mode: ExecutionMode = 'PAPER'; // Defaults safely to PAPER mode
  private activeAdapter: IBrokerAdapter;

  constructor() {
    this.activeAdapter = new ZerodhaKiteAdapter();
  }

  public getMode(): ExecutionMode {
    return this.mode;
  }

  public setMode(newMode: ExecutionMode): { mode: ExecutionMode; message: string } {
    this.mode = newMode;
    return {
      mode: this.mode,
      message: newMode === 'LIVE' 
        ? '⚠️ Switched to LIVE BROKERAGE MODE. Orders placed will route to broker.' 
        : 'Switched to PAPER SIMULATION MODE.'
    };
  }

  public getActiveBrokerName(): string {
    return this.activeAdapter.name;
  }

  public isConnected(): boolean {
    return this.activeAdapter.isConnected();
  }

  public async connectBroker(credentials: BrokerCredentials) {
    return this.activeAdapter.connect(credentials);
  }

  public async getFunds() {
    return this.activeAdapter.getFunds();
  }

  public async getPositions() {
    return this.activeAdapter.getPositions();
  }

  public async getHoldings() {
    return this.activeAdapter.getHoldings();
  }

  public async placeLiveOrder(order: LiveOrderInput): Promise<LiveOrderResult> {
    const quote = await marketDataService.getQuote(order.symbol);
    
    // Evaluate pre-trade risk controls
    const riskCheck = riskEngine.evaluateOrder(order, quote.price);
    if (!riskCheck.allowed) {
      throw new Error(`[Risk Engine Blocked] ${riskCheck.reason}`);
    }

    return this.activeAdapter.placeOrder(order);
  }

  public async cancelLiveOrder(orderId: string): Promise<boolean> {
    return this.activeAdapter.cancelOrder(orderId);
  }

  public async squareOffPosition(symbol: string, product: 'CNC' | 'MIS', quantity: number) {
    return this.activeAdapter.squareOffPosition(symbol, product, quantity);
  }

  /**
   * Emergency Kill-Switch:
   * 1. Cancels all pending broker orders
   * 2. Places market square-off orders for all open positions
   * 3. Locks Risk Engine against new orders
   */
  public async executeKillSwitch(): Promise<{ cancelledOrders: number; squaredOffPositions: number; message: string }> {
    const result = await this.activeAdapter.squareOffAll();
    riskEngine.triggerKillSwitch();

    return {
      cancelledOrders: result.cancelledOrders,
      squaredOffPositions: result.squaredOffPositions,
      message: `EMERGENCY KILL-SWITCH EXECUTED: ${result.squaredOffPositions} positions squared-off, ${result.cancelledOrders} open orders cancelled. Live trading locked.`
    };
  }
}

export const brokerManager = new BrokerManager();
