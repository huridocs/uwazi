import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';

const plaintextPageSelector = (page: number) =>
  `[data-entity-plaintext] [data-plaintext-page="${page}"]`;

const scrollToPlaintextPage = (page: number): void => {
  if (typeof document === 'undefined' || page < 1) {
    return;
  }
  const element = document.querySelector(plaintextPageSelector(page));
  scrollIntoView(element, { block: 'start' });
};

export { plaintextPageSelector, scrollToPlaintextPage };
