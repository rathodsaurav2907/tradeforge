import pandas as pd
import numpy as np

from analytics.analytics.engine import AnalyticsEngine


def build_sample_bars():
    base = 100.0
    rows = []
    for i in range(30):
        close = base + i * 0.6 + (i % 4) * 0.3
        high = close + 2.0
        low = close - 2.0
        rows.append({
            'timestamp': f'2024-01-{(i % 28) + 1:02d}T00:00:00Z',
            'open': close - 0.5,
            'high': high,
            'low': low,
            'close': close,
            'volume': 1000 + i * 10
        })
    return rows


def test_calculate_indicators_includes_stochastic():
    df = AnalyticsEngine.bars_to_dataframe(build_sample_bars())
    result = AnalyticsEngine.calculate_indicators(df)

    assert 'stoch_k' in result.columns
    assert 'stoch_d' in result.columns
    assert result['stoch_k'].notna().all()
    assert result['stoch_d'].notna().all()
    assert (0 <= result['stoch_k']).all()
    assert (result['stoch_k'] <= 100).all()
    assert (0 <= result['stoch_d']).all()
    assert (result['stoch_d'] <= 100).all()


def test_generate_ai_trading_signals_returns_expected_keys():
    df = AnalyticsEngine.bars_to_dataframe(build_sample_bars())
    signal = AnalyticsEngine.generate_ai_trading_signals(df, ticker='RELIANCE')

    assert signal['ticker'] == 'RELIANCE'
    assert signal['action'] in {'STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'}
    assert 0 <= signal['confidence'] <= 100
    assert 'reasons' in signal
    assert isinstance(signal['reasons'], list)
