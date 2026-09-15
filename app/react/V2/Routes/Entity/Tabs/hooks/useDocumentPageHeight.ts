import { useEffect, useState } from 'react';

const pageElementFor = (pageNumber: number) =>
  document.querySelector<HTMLDivElement>(`.page[data-page-number="${pageNumber}"]`);

const startPageHeightObserver = (
  pageElement: HTMLDivElement,
  setPageHeight: (height: number | undefined) => void
) => {
  const updateHeight = () => {
    const { height } = pageElement.getBoundingClientRect();
    setPageHeight(height > 0 ? height : undefined);
  };
  updateHeight();
  const observer = new ResizeObserver(updateHeight);
  observer.observe(pageElement);
  return () => observer.disconnect();
};

const observePageHeight = (
  pageNumber: number,
  setPageHeight: (height: number | undefined) => void
) => {
  const pageElement = pageElementFor(pageNumber);
  if (pageElement) {
    return startPageHeightObserver(pageElement, setPageHeight);
  }
  setPageHeight(undefined);
  return undefined;
};

const useDocumentPageHeight = (isRaw: boolean, pageNumber: number) => {
  const [pageHeight, setPageHeight] = useState<number | undefined>();
  useEffect(() => {
    if (isRaw) {
      setPageHeight(undefined);
      return undefined;
    }
    return observePageHeight(pageNumber, setPageHeight);
  }, [isRaw, pageNumber]);
  return pageHeight;
};

export { useDocumentPageHeight };
