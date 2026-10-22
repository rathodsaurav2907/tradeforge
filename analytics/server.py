from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import uvicorn
from analytics.engine import AnalyticsEngine

app = FastAPI(
    title="TradeForge Analytics & AI Engine",
    description="Microservice for Quantitative Technical Indicators and AI Trading Signals using Pandas & NumPy",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Bar(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0

class IndicatorsRequest(BaseModel):
    ticker: Optional[str] = "TICKER"
    bars: List[Bar]

class SignalsRequest(BaseModel):
    ticker: str = "AAPL"
    bars: List[Bar]

class Position(BaseModel):
    symbol: str
    quantity: float
    avg_price: float
    current_price: float

class PortfolioRiskRequest(BaseModel):
    cash: float
    positions: List[Position]

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "TradeForge Python Analytics Service",
        "engine": "pandas & numpy"
    }

@app.post("/api/indicators")
def calculate_indicators(payload: IndicatorsRequest):
    try:
        raw_bars = [bar.model_dump() for bar in payload.bars]
        df = AnalyticsEngine.bars_to_dataframe(raw_bars)
        enriched_df = AnalyticsEngine.calculate_indicators(df)
        
        # Format timestamps back to ISO strings
        enriched_df['timestamp'] = enriched_df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        enriched_df = enriched_df.replace({float('nan'): None})
        
        return {
            "ticker": payload.ticker,
            "count": len(enriched_df),
            "bars": enriched_df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/signals")
def generate_signals(payload: SignalsRequest):
    try:
        raw_bars = [bar.model_dump() for bar in payload.bars]
        df = AnalyticsEngine.bars_to_dataframe(raw_bars)
        signals = AnalyticsEngine.generate_ai_trading_signals(df, ticker=payload.ticker)
        return signals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio-risk")
def calculate_portfolio_risk(payload: PortfolioRiskRequest):
    try:
        pos_list = [p.model_dump() for p in payload.positions]
        metrics = AnalyticsEngine.calculate_portfolio_metrics(pos_list, payload.cash)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
