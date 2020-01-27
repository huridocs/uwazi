/** @format */

export interface IRequestParams {
  data: Object | undefined;
  headers: Object;
  add(data: Object): IRequestParams;
  set(data: Object): IRequestParams;
  onlyHeaders(): IRequestParams;
}

class RequestParams {
  data: Object | undefined;

  headers: Object;

  constructor(data: Object | undefined, headers: Object = {}) {
    this.data = data;
    this.headers = headers;
  }

  add(data: Object) {
    return new RequestParams({ ...this.data, ...data }, this.headers);
  }

  set(data: Object) {
    return new RequestParams(data, this.headers);
  }

  onlyHeaders() {
    return new RequestParams(undefined, this.headers);
  }
}

export { RequestParams };
