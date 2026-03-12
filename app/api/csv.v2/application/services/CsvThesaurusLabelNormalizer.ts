const normalizeCsvThesaurusLabel = (label: string) => {
  const trimmed = label.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

export { normalizeCsvThesaurusLabel };
