export class RequestParams<DataT = any> {
  data?: DataT = undefined;

  headers: Object = {};

  constructor(data: DataT | undefined = undefined, headers: Object = {}) {
    this.data = data;
    this.headers = headers;
  }

  add(data: DataT) {
    return new RequestParams<DataT>({ ...this.data, ...data }, this.headers);
  }

  set(data: DataT) {
    return new RequestParams<DataT>(data, this.headers);
  }

  onlyHeaders() {
    return new RequestParams<DataT>(undefined, this.headers);
  }
}
