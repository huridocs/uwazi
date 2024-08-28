interface SemanticConfig {
  active: boolean;
  templates: {
    template: string;
    commonProperties?: string[];
    properties?: string[];
  }[];
}

export type { SemanticConfig };
