
window.Measures = {
  times: {},
  add(name, time) {
    if (!this.times[name]) {
      this.times[name] = {
        totalTime: time,
        calls: 1
      };
      return;
    }
    this.times[name].totalTime += time;
    this.times[name].calls += 1;
  },
  clear() {
    this.times = {};
  }
};

Function.prototype.MeasurePerformance = function(context) {
  let parameters = Array.prototype.slice.call(arguments);
  parameters.splice(0, 1);
  let start = performance.now();
  var result = this.apply(context, parameters);
  //console.log(this.name);
  //console.log(performance.now() - start);
  window.Measures.add(this.name, performance.now() - start);
  return result;
}
