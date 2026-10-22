import { LiveOrderInput } from '../brokers/IBrokerAdapter';

export interface RiskSettings {
  maxOrderValue: number;          // Default: ₹1,00,000
  maxDailyLoss: number;           // Default: ₹15,000
  maxQuantityPerOrder: number;    // Default: 500 shares
  isKillSwitchLocked: boolean;    // Emergency circuit lock
}

export class RiskEngine {
  private settings: RiskSettings = {
    maxOrderValue: 100000.00,
    maxDailyLoss: 15000.00,
    maxQuantityPerOrder: 500,
    isKillSwitchLocked: false
  };

  private dailyAccumulatedLoss = 0.00;
  private lastOrderTime: Map<string, number> = new Map(); // For duplicate debounce

  public getSettings(): RiskSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<RiskSettings>): RiskSettings {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  public triggerKillSwitch(): void {
    this.settings.isKillSwitchLocked = true;
  }

  public unlockKillSwitch(): void {
    this.settings.isKillSwitchLocked = false;
  }

  public evaluateOrder(order: LiveOrderInput, currentPrice: number): { allowed: boolean; reason?: string } {
    // 1. Check Kill-switch Lockout
    if (this.settings.isKillSwitchLocked) {
      return {
        allowed: false,
        reason: 'Trading is locked by Emergency Kill-Switch. Unlock in Risk Settings to resume live orders.'
      };
    }

    // 2. Check Daily Drawdown Circuit Breaker
    if (this.dailyAccumulatedLoss >= this.settings.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit (₹${this.settings.maxDailyLoss.toLocaleString('en-IN')}) reached. Live trading circuit broken for today.`
      };
    }

    // 3. Max Quantity Limit
    if (order.quantity > this.settings.maxQuantityPerOrder) {
      return {
        allowed: false,
        reason: `Order quantity (${order.quantity}) exceeds maximum permitted per order (${this.settings.maxQuantityPerOrder} shares).`
      };
    }

    // 4. Max Order Value Ceiling
    const estimatedValue = (order.price || currentPrice) * order.quantity;
    if (estimatedValue > this.settings.maxOrderValue) {
      return {
        allowed: false,
        reason: `Estimated order value (₹${estimatedValue.toLocaleString('en-IN')}) exceeds maximum allowed ceiling of ₹${this.settings.maxOrderValue.toLocaleString('en-IN')}.`
      };
    }

    // 5. Duplicate Order Debounce (3-second window)
    const orderKey = `${order.symbol}:${order.side}:${order.product}:${order.quantity}`;
    const now = Date.now();
    const lastTime = this.lastOrderTime.get(orderKey) || 0;
    if (now - lastTime < 3000) {
      return {
        allowed: false,
        reason: 'Duplicate order detected within 3 seconds. Please wait before re-submitting.'
      };
    }
    this.lastOrderTime.set(orderKey, now);

    return { allowed: true };
  }
}

export const riskEngine = new RiskEngine();
