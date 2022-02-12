export function withProbability(prob: number, action: () => void) {
  const num = Math.random(); // [0, 1)

  if (num < prob) {
    action();
  }
}
