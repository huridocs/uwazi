import { scrollIntoView } from '#app/V2/helpers/scrollIntoView.js';

const triggerScroll = (ref: React.RefObject<HTMLDivElement>, frameId: number): number => {
  let attempts = 0;
  let id = frameId;

  const attemptScroll = () => {
    if (attempts > 9) {
      return;
    }

    if (ref.current && ref.current.clientHeight > 0) {
      scrollIntoView(ref.current);
      return;
    }

    attempts += 1;
    id = requestAnimationFrame(attemptScroll);
  };

  attemptScroll();
  return id;
};

const pickMostVisiblePage = (
  visibleHeightByPage: Map<number, number>,
  maxPages: number,
  previousPage = 0
): number => {
  let bestPage = 0;
  let bestHeight = 0;
  visibleHeightByPage.forEach((height, pageNumber) => {
    if (pageNumber < 1 || pageNumber > maxPages || height <= 0) {
      return;
    }
    const keepPreviousOnTie = height === bestHeight && pageNumber === previousPage;
    if (height > bestHeight || keepPreviousOnTie) {
      bestHeight = height;
      bestPage = pageNumber;
    }
  });
  return bestPage;
};

export { triggerScroll, pickMostVisiblePage };
