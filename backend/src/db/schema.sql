-- TradeForge PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolios (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) DEFAULT 'Main Paper Account',
    cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id VARCHAR(64) REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP_LOSS')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED')),
    quantity NUMERIC(12, 4) NOT NULL,
    filled_quantity NUMERIC(12, 4) DEFAULT 0.0,
    price NUMERIC(12, 4),               -- Limit/trigger price
    avg_fill_price NUMERIC(12, 4),      -- Average execution price
    total_cost NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL,
    price NUMERIC(12, 4) NOT NULL,
    fee NUMERIC(10, 2) DEFAULT 0.00,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS positions (
    id VARCHAR(64) PRIMARY KEY,
    portfolio_id VARCHAR(64) REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL DEFAULT 0.0,
    avg_entry_price NUMERIC(12, 4) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, symbol)
);

-- Double-Entry Financial Ledger
CREATE TABLE IF NOT EXISTS ledger (
    id VARCHAR(64) PRIMARY KEY,
    portfolio_id VARCHAR(64) REFERENCES portfolios(id) ON DELETE CASCADE,
    entry_type VARCHAR(50) NOT NULL, -- 'DEPOSIT', 'BUY_ORDER', 'SELL_ORDER', 'FEE'
    amount NUMERIC(15, 2) NOT NULL,  -- Positive for credit, negative for debit
    balance_after NUMERIC(15, 2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
