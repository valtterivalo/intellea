/**
 * @fileoverview Parse CSS color strings into three.js colors.
 * Exports: parseColorStyle
 */

import { Color } from 'three';

const rgbaRegex = /rgba?\(([^)]+)\)/i;

const parseChannel = (value: string): number => {
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    const percent = Number.parseFloat(trimmed.replace('%', ''));
    if (Number.isNaN(percent)) return 0;
    return Math.round((percent / 100) * 255);
  }
  const numeric = Number.parseFloat(trimmed);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(255, numeric));
};

const parseRgba = (value: string): { r: number; g: number; b: number; a: number } | null => {
  const match = rgbaRegex.exec(value);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return null;
  const r = parseChannel(parts[0]);
  const g = parseChannel(parts[1]);
  const b = parseChannel(parts[2]);
  const alpha = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
  const a = Number.isNaN(alpha) ? 1 : Math.max(0, Math.min(1, alpha));
  return { r, g, b, a };
};

export const parseColorStyle = (value: string, target?: Color): Color => {
  const color = target ?? new Color();
  const rgba = parseRgba(value);
  if (rgba) {
    color.setRGB(rgba.r / 255, rgba.g / 255, rgba.b / 255);
    if (rgba.a < 1) {
      color.multiplyScalar(rgba.a);
    }
    return color;
  }
  color.setStyle(value);
  return color;
};
