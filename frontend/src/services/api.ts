import React from 'react';
import { api } from '../services/api';

export interface SmartScoreResponse {
  symbol: string;
  score: number;
  label: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  momentum: number;
  summary: string;
}

export const api = {
  ...
};
