import Condition from "./condition.js";

const ALL = {
  toString: function() {
    return 'ALL';
  }
};


export default class Selector {

  constructor(collection, metric, condition) {
    if (Array.isArray(metric)) {
      metric = metric.map(function (mpart) {
        return mpart.value ? mpart.value : mpart.toString();
      });
    } else if (typeof metric == 'string' && metric.toUpperCase() == 'ALL') {
      metric = [ALL];
    } else {
      throw new Error(`Expected metric to be an Array, got '${metric}' instead`);
    }
    this.collection = collection;
    this.metric = metric;
    this.condition = condition;
  }

  where(condition, operator) {
    if (! condition instanceof Condition)
      throw new Error("Invalid query condition");
    if (operator && this.condition) {
      condition = this.condition[operator](condition);
    }
    var selector = new Selector(this.collection, this.metric, condition);
    return selector;
  }

  toString() {
    var metric = this._encodeMetric(),
        collection = this._encodeCollection(),
        str = `${metric} FROM ${collection}`;
    if (this.condition)
      str += ' WHERE ' + this.condition;
    return str;
  }

  _encodeCollection() {
    return `'${this.collection}'`;
  }

  _encodeMetric() {
    return this.metric.map(function(part) {
      if (part === '*' || part === ALL)
        return `${part}`;
      else
        return `'${part}'`;
    }).join('.');
  }
}
