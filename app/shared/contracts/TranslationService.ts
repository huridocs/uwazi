type RequestTranslationRequest = {
  text: string;
  language_from: string;
  language_to: string;
};

type RequestTranslationResponse = {
  translated_text: string;
};

export type { RequestTranslationRequest, RequestTranslationResponse };
