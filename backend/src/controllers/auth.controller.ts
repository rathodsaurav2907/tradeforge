import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { inMemoryStore, DEMO_USER_ID, DEMO_PORTFOLIO_ID } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  private static generateTokenPair(userId: string, email: string) {
    const accessToken = jwt.sign(
      { id: userId, email },
      config.jwtSecret,
      { expiresIn: config.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { id: userId, email },
      config.jwtRefreshSecret,
      { expiresIn: config.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  public static async register(req: Request, res: Response) {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    // Check if user already exists
    for (const u of inMemoryStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'User with this email already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const portfolioId = uuidv4();
    const tokens = AuthController.generateTokenPair(userId, email.toLowerCase());

    const user = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName,
      refresh_token: tokens.refreshToken,
      created_at: new Date()
    };

    inMemoryStore.users.set(userId, user);

    // Create default paper portfolio with $100k
    inMemoryStore.portfolios.set(portfolioId, {
      id: portfolioId,
      user_id: userId,
      account_name: 'Primary Paper Portfolio',
      cash_balance: config.defaultVirtualCash,
      currency: 'USD',
      created_at: new Date()
    });

    // Record initial funding ledger
    inMemoryStore.ledger.push({
      id: uuidv4(),
      portfolio_id: portfolioId,
      entry_type: 'DEPOSIT',
      amount: config.defaultVirtualCash,
      balance_after: config.defaultVirtualCash,
      description: 'Initial paper trading virtual balance grant',
      reference_id: null,
      created_at: new Date()
    });

    return res.status(201).json({
      message: 'Account created successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      portfolioId
    });
  }

  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let foundUser: any = null;
    for (const u of inMemoryStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (foundUser.id !== DEMO_USER_ID) {
      const match = await bcrypt.compare(password, foundUser.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const tokens = AuthController.generateTokenPair(foundUser.id, foundUser.email);
    foundUser.refresh_token = tokens.refreshToken;
    inMemoryStore.users.set(foundUser.id, foundUser);

    return res.json({
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        fullName: foundUser.full_name
      }
    });
  }

  public static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string; email: string };
      const user = inMemoryStore.users.get(decoded.id);

      if (!user || user.refresh_token !== refreshToken) {
        return res.status(403).json({ error: 'Invalid or revoked refresh token.' });
      }

      // Rotate tokens
      const newTokens = AuthController.generateTokenPair(user.id, user.email);
      user.refresh_token = newTokens.refreshToken;
      inMemoryStore.users.set(user.id, user);

      return res.json({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      });
    } catch (err) {
      return res.status(403).json({ error: 'Expired or invalid refresh token.' });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (userId && inMemoryStore.users.has(userId)) {
      const user = inMemoryStore.users.get(userId);
      user.refresh_token = null;
      inMemoryStore.users.set(userId, user);
    }
    return res.json({ message: 'Logged out successfully.' });
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id || DEMO_USER_ID;
    const user = inMemoryStore.users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at
    });
  }
}
