/**
 * Metrics utilities
 * Author: Aruzhan Mektepbayeva
 */

export function accuracy(yTrue: number[], yPred: number[]): number {
  if (yTrue.length === 0) return 0;

  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === yPred[i]) correct++;
  }
  return correct / yTrue.length;
}

export function latency(start: number, end: number): number {
  return Math.max(0, end - start);
}
