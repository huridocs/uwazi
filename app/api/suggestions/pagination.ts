type Props = {
  currentPage?: number;
  pageSize?: number;
};

export class Pagination {
  private DEFAULT_PAGE_SIZE = 30;

  skip: number;

  pageSize: number;

  currentPage: number;

  constructor(props: Props) {
    this.pageSize = props.pageSize ?? this.DEFAULT_PAGE_SIZE;
    this.currentPage = props.currentPage ?? 1;
    this.skip = this.calculateSkip();
  }

  private calculateSkip() {
    return this.pageSize * (this.currentPage - 1);
  }

  calculateNumberOfPages(items: number) {
    return Math.ceil(items / this.pageSize);
  }
}
