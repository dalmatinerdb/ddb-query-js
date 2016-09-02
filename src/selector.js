export default class Selector {

  constructor(collection, metric) {
    if (! Array.isArray(metric)) {
      throw new Error(`Expected metric to be an Array, got '${metric}' instead`);
    }
    this.collection = collection;
    this.metric = metric.map(function (mpart) {
      return mpart.value ? mpart.value : mpart.toString();
    });
  }

  toString() {
    var metric = this._encodeMetric(),
        collection = this._encodeCollection();
    return  `${metric} FROM ${collection}`;
  }

  _encodeCollection() {
    return `'${this.collection}'`;
  }

  _encodeMetric() {
    return this.metric.map(function(part) {
      if (part === '*')
        return `${part}`;
      else
        return `'${part}'`;
    }).join('.');
  }
}
