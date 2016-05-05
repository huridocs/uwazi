export default {
  currentUTC() {
    let now = new Date();
    return new Date(now.getUTCFullYear(),
                    now.getUTCMonth(),
                    now.getUTCDate(),
                    now.getUTCHours(),
                    now.getUTCMinutes(),
                    now.getUTCSeconds()).getTime();
  }
}
