import { Request, Response, NextFunction } from 'express';

export function validateOrderInput(req: Request, res: Response, next: NextFunction) {
  const { symbol, side, orderType, quantity, price } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Valid ticker symbol is required.' });
  }

  if (!side || !['BUY', 'SELL'].includes(side.toUpperCase())) {
    return res.status(400).json({ error: 'Order side must be either BUY or SELL.' });
  }

  if (!orderType || !['MARKET', 'LIMIT', 'STOP_LOSS'].includes(orderType.toUpperCase())) {
    return res.status(400).json({ error: 'Order type must be MARKET, LIMIT, or STOP_LOSS.' });
  }

  const numQty = parseFloat(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number.' });
  }

  if (orderType.toUpperCase() === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
    return res.status(400).json({ error: 'Limit orders require a valid price greater than 0.' });
  }

  // Sanitize body values
  req.body.symbol = symbol.trim().toUpperCase();
  req.body.side = side.toUpperCase();
  req.body.orderType = orderType.toUpperCase();
  req.body.quantity = numQty;
  if (price) {
    req.body.price = parseFloat(price);
  }

  next();
}
