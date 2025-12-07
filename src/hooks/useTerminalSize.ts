/**
 * Hook for managing terminal size and responsive layout calculations.
 * Provides terminal dimensions, handles resize events, and calculates layout constraints.
 */

import { useState, useEffect } from 'react';
import type { LayoutDimensions } from '../types/ui';

/**
 * Hook for managing terminal size and handling resize events.
 * Returns current dimensions and updates automatically on terminal resize.
 * 
 * @returns Object containing terminal width, height, and layout calculations
 */
export function useTerminalSize(): {
  width: number;
  height: number;
  dimensions: LayoutDimensions;
} {
  const [width, setWidth] = useState<number>(process.stdout.columns || 120);
  const [height, setHeight] = useState<number>(process.stdout.rows || 30);

  useEffect(() => {
    const handler = () => {
      setWidth(process.stdout.columns || 120);
      setHeight(process.stdout.rows || 30);
    };

    process.stdout.on('resize', handler);
    return () => {
      process.stdout.off('resize', handler);
    };
  }, []);

  const availableWidth = Math.max(30, width - 10);
  const maxLine = Math.max(20, availableWidth - 4);

  const dimensions: LayoutDimensions = {
    width,
    height,
    availableWidth,
    maxLine,
  };

  return {
    width,
    height,
    dimensions,
  };
}