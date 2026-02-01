export async function fetchWithMinDuration<T>(
  fn: () => Promise<T>,
  minMs = 900,
): Promise<T> {
  const [result] = await Promise.all([
    fn(),
    new Promise((r) => setTimeout(r, minMs)),
  ]);
  return result;
}
