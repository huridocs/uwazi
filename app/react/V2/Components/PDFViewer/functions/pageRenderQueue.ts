class PageRenderQueue {
  highestPriorityPage: string | null = null;

  isPriority(pageNumber: number): boolean {
    return this.highestPriorityPage === `page${pageNumber}`;
  }

  prioritize(pageNumber: number): void {
    this.highestPriorityPage = `page${pageNumber}`;
  }
}

export { PageRenderQueue };
