import csvtojson from 'csvtojson';

const csv = (readStream, stopOnError = false) => ({
  onRow(onRowCallback) {
    this.onRowCallback = onRowCallback;
    return this;
  },
  onError(onErrorCallback) {
    this.onErrorCallback = onErrorCallback;
    return this;
  },
  async read() {
    return new Promise((resolve, reject) => {
      csvtojson({ delimiter: [',', ';'] })
      .fromStream(readStream)
      .subscribe(async (row, index) => {
        try {
          await this.onRowCallback(row, index);
        } catch (e) {
          if (stopOnError) {
            readStream.unpipe();
            readStream.destroy();
            resolve();
          }

          this.onErrorCallback(e, row, index);
        }
      }, reject, resolve);
    });
  }
});

export default csv;
