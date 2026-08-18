type DrawFn = () => void;

class PageRenderQueue {
  highestPriorityPage: string | null = null;

  private pending = new Map<number, DrawFn>();

  private running: number | null = null;

  private pumpScheduled = false;

  isPriority(pageNumber: number): boolean {
    return this.highestPriorityPage === `page${pageNumber}`;
  }

  prioritize(pageNumber: number): void {
    this.highestPriorityPage = `page${pageNumber}`;
    this.schedulePump();
  }

  request(pageNumber: number, draw: DrawFn): void {
    this.pending.set(pageNumber, draw);
    this.schedulePump();
  }

  complete(pageNumber: number): void {
    this.pending.delete(pageNumber);
    if (this.running === pageNumber) {
      this.running = null;
    }
    this.pump();
  }

  cancel(pageNumber: number): void {
    this.complete(pageNumber);
  }

  private schedulePump(): void {
    if (this.pumpScheduled) {
      return;
    }
    this.pumpScheduled = true;
    queueMicrotask(() => {
      this.pumpScheduled = false;
      this.pump();
    });
  }

  private pump(): void {
    if (this.running !== null) {
      return;
    }
    const next = this.pickNext();
    const draw = next === null ? undefined : this.pending.get(next);
    if (next === null || !draw) {
      return;
    }
    this.pending.delete(next);
    this.running = next;
    draw();
  }

  private pickNext(): number | null {
    const priority = this.parsePriority();
    if (priority !== null && this.pending.has(priority)) {
      return priority;
    }
    const first = this.pending.keys().next();
    return first.done ? null : first.value;
  }

  private parsePriority(): number | null {
    if (!this.highestPriorityPage?.startsWith('page')) {
      return null;
    }
    const n = Number(this.highestPriorityPage.slice(4));
    return Number.isFinite(n) ? n : null;
  }
}

export { PageRenderQueue };
