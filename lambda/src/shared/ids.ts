// ─────────────────────────────────────────────────────────────────────────────
// ID + ORDER NUMBER GENERATION
// ─────────────────────────────────────────────────────────────────────────────
import { randomUUID } from 'node:crypto';

export const newId = (): string => randomUUID();

// Human-readable order number: PUL-YYYYMMDD-XXXX (4 random digits)
export function newOrderNumber(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `PUL-${y}${m}${d}-${rand}`;
}

export const nowIso = (): string => new Date().toISOString();
