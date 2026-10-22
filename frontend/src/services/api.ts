export interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20?: number;
  sma_50?: number;
  ema_9?: number;
  ema_21?: number;
  rsi_14?: number;
  macd_line?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_lower?: number;
  stoch_k?: number;
  stoch_d?: number;
  atr_14?: number;
}
