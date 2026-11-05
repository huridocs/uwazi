const runSequentially = async <T, R>(items: T[], runOne: (item: T) => Promise<R>): Promise<R[]> => {
  if (!items.length) {
    return [];
  }
  const [first, ...rest] = items;
  const current = await runOne(first as T);
  return [current, ...(await runSequentially(rest, runOne))];
};

export { runSequentially };
