type TranslateInput = {
  text: string;
  language_from: string;
  language_to: string;
};

type TranslateOutput = {
  translated_text: string;
};

export type { TranslateInput, TranslateOutput };
