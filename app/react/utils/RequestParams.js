class RequestParams {
  constructor(data, headers = {}) {
    this.data = data;
    this.headers = headers;
  }

  add(data) {
    return new RequestParams({ ...this.data, ...data }, this.headers);
  }

  set(data) {
    return new RequestParams(data, this.headers);
  }

  onlyHeaders() {
    return new RequestParams(undefined, this.headers);
  }
}

export { RequestParams };
