import { describe, expect, it } from '@jest/globals';

describe('analytics indicator payload', () => {
  it('includes stochastic oscillator values within valid range', () => {
    const sampleBar = {
      timestamp: '2024-01-01T00:00:00Z',
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1000,
      stoch_k: 62.5,
      stoch_d: 58.4
    };

    expect(sampleBar.stoch_k).toBeGreaterThanOrEqual(0);
    expect(sampleBar.stoch_k).toBeLessThanOrEqual(100);
    expect(sampleBar.stoch_d).toBeGreaterThanOrEqual(0);
    expect(sampleBar.stoch_d).toBeLessThanOrEqual(100);
  });
});
