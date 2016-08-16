export class Selector {

  constructor(collection, metric, variables) {
    this.collection = collection;
    this.metric = metric.map(function (mpart) {
      return mpart.value ? mpart.value : mpart.toString();
    });
    this.variables = variables;
  }

  where(condition) {
    this.condition = condition;
    return this;
  }

  toString() {
    var metric = this._encodeMetric(),
        collection = this._encodeCollection(),
        str = `${metric} FROM ${collection}`;
    if (this.condition) {
      str += ` WHERE ${this.condition}`;
    }
    return str;
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
