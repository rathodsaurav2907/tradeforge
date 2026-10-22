import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from analytics.engine import AnalyticsEngine

def generate_mock_bars(count=60, start_price=150.0):
    bars = []
    base_time = datetime.now() - timedelta(days=count)
    price = start_price
    np.random.seed(42)
    
    for i in range(count):
        change = np.random.normal(0.2, 2.0)
        open_p = price
        close_p = price + change
        high_p = max(open_p, close_p) + abs(np.random.normal(0.5, 0.5))
        low_p = min(open_p, close_p) - abs(np.random.normal(0.5, 0.5))
        vol = float(np.random.randint(100000, 5000000))
        
        bars.append({
            "timestamp": (base_time + timedelta(days=i)).isoformat(),
            "open": round(open_p, 2),
            "high": round(high_p, 2),
            "low": round(low_p, 2),
            "close": round(close_p, 2),
            "volume": vol
        })
        price = close_p
    return bars

def test_dataframe_conversion():
    bars = generate_mock_bars(10)
    df = AnalyticsEngine.bars_to_dataframe(bars)
    assert len(df) == 10
    assert "close" in df.columns
    assert "volume" in df.columns

def test_indicators_calculation():
    bars = generate_mock_bars(50)
    df = AnalyticsEngine.bars_to_dataframe(bars)
    enriched = AnalyticsEngine.calculate_indicators(df)
    
    assert "sma_20" in enriched.columns
    assert "rsi_14" in enriched.columns
    assert "macd_line" in enriched.columns
    assert "macd_signal" in enriched.columns
    assert "bb_upper" in enriched.columns
    assert "bb_lower" in enriched.columns
    assert "atr_14" in enriched.columns

def test_ai_trading_signals():
    bars = generate_mock_bars(40)
    df = AnalyticsEngine.bars_to_dataframe(bars)
    signals = AnalyticsEngine.generate_ai_trading_signals(df, ticker="NVDA")
    
    assert signals["ticker"] == "NVDA"
    assert signals["action"] in ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]
    assert 0 <= signals["confidence"] <= 100
    assert len(signals["reasons"]) > 0

def test_portfolio_risk_metrics():
    positions = [
        {"symbol": "AAPL", "quantity": 10, "avg_price": 170.0, "current_price": 180.0},
        {"symbol": "TSLA", "quantity": 5, "avg_price": 200.0, "current_price": 210.0}
    ]
    metrics = AnalyticsEngine.calculate_portfolio_metrics(positions, cash=10000.0)
    assert metrics["cash"] == 10000.0
    assert metrics["total_equity"] > 10000.0
    assert "portfolio_sharpe" in metrics
    assert "risk_profile" in metrics
