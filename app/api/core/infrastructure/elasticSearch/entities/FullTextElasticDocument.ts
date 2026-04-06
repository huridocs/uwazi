type FullTextElasticDocument = {
  tenantId: string;

  [key: `fullText_${string}`]: string;

  filename: string;

  fullText: {
    name: 'fullText';
    parent: string;
  };
};

export type { FullTextElasticDocument };
