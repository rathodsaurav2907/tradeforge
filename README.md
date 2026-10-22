# TradeForge ⚡

> **TradeForge** is an institutional-grade, AI-enhanced paper trading and quantitative analytics platform. Built with dedicated modular services across TypeScript, Python, and SQL.

---

## 🏗 Architecture & Tech Stack

TradeForge is structured with strict separation of concerns into distinct code folders for each language:

```
tradeforge/
├── frontend/               # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/     # UI components (Navbar, widgets, indicators)
│   │   ├── pages/          # Dashboard, Watchlist, Charts, PaperOrders, Portfolio
│   │   └── services/       # Typed Axios API Client
│   └── package.json
│
├── backend/                # Node.js + Express API + TypeScript
│   ├── src/
│   │   ├── controllers/    # Route controllers (Auth, Market, Orders, Portfolio, Analytics)
│   │   ├── db/             # PostgreSQL DDL schema & in-memory transactional fallback
│   │   ├── middleware/     # JWT Auth & Order Validation Engine
│   │   ├── routes/         # Express API routers
│   │   ├── services/       # Market Data Adapter, Paper Trading Engine, Analytics Bridge
│   │   └── server.ts       # Server bootstrap
│   └── package.json
│
├── analytics/              # Python Quantitative & AI Service
│   ├── analytics/
│   │   ├── __init__.py
│   │   └── engine.py       # Vectorized Technical Indicators & AI Signals (pandas & numpy)
│   ├── tests/              # Pytest verification suite
│   ├── server.py           # FastAPI Microservice on port 8000
│   └── requirements.txt
│
├── docker-compose.yml      # Orchestrates Postgres, Backend, Frontend & Analytics
└── README.md
```

---

## 🚀 Key Modules & Capabilities

### 1. 📊 Frontend (`frontend/`)
- **Interactive Dashboard**: High-level market indices, top gainers/losers, active equity metrics, and quick-order ticket.
- **Watchlist**: Real-time mock stream across equities, ETFs, and cryptocurrencies with search and 24h spread monitoring.
- **Charts & Overlays**: Candlestick chart featuring SMA(20), EMA(9), Bollinger Bands, and RSI(14) calculated via Python.
- **Paper Orders**: Limit & Market order execution, Level 2 depth preview, active orders manager, and cancellation.
- **Portfolio & Ledger**: Realized vs unrealized P&L, holdings positions, Sharpe ratio, and double-entry financial ledger audit trail.

### 2. ⚡ Backend Engine (`backend/`)
- **Authentication**: JWT verification with demo account fallback for frictionless onboarding.
- **Validation & Rule Engine**: Comprehensive checks on order types, positive quantities, and cash/share sufficiency.
- **Market-Data Adapter**: Pluggable interface (`MarketDataAdapter`) with mock random-walk simulator and ready integration hooks for licensed feeds (Alpaca, Polygon, IEX).
- **Paper Trading Engine**: Virtual cash allocation ($100k), simulated execution, weighted average entry price updates, and double-entry ledger bookkeeping.
- **PostgreSQL Database**: DDL schema for `users`, `portfolios`, `orders`, `trades`, `positions`, and `ledger`.

### 3. 🐍 Python Analytics & AI (`analytics/`)
- **Vectorized Technical Indicators**:
  - Moving averages: SMA (20, 50, 200), EMA (9, 21)
  - Momentum: RSI (14), MACD (12, 26, 9)
  - Volatility & Range: Bollinger Bands (20, 2), Average True Range (ATR 14), Annualized Historical Volatility
- **AI Signal Synthesizer**:
  - Multi-indicator scoring engine yielding `STRONG_BUY`, `BUY`, `HOLD`, `SELL`, or `STRONG_SELL` with confidence scores.
  - Adaptive 1.5x ATR Stop-Loss and 3.0x ATR Take-Profit calculation.
  - Value-at-Risk (95% 1-day VaR) and portfolio diversification score.

---

## 🛠 Local Development Quickstart

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git
- (Optional) Docker & Docker Compose

### Option A: Running with Docker Compose (Recommended)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Python Analytics: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

### Option B: Running Services Standalone

#### 1. Start Python Analytics Microservice
```bash
cd analytics
pip install -r requirements.txt
python server.py
# Running on http://localhost:8000
```

#### 2. Start Node.js Express Backend
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:4000
```

#### 3. Start React + Vite Frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Testing

### Test Python Analytics Engine:
```bash
cd analytics
pytest
```

---

## 📜 License
MIT License. TradeForge &copy; 2026.
