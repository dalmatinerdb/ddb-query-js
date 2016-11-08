import Condition from "./condition.js";
import Timeshift from "./timeshift.js";


const ALL = {
  toString: function() {
    return 'ALL';
  }
};


function isKeyword(part) {
  return part === ALL;
}


export default class Selector {

  constructor(collection, metric) {
    if (Array.isArray(metric)) {
      metric = metric.map(function (mpart) {
        if (isKeyword(mpart)) return mpart;
        return mpart.value ? mpart.value : mpart.toString();
      });
    } else if (typeof metric == 'string' && metric.toUpperCase() == 'ALL') {
      metric = [ALL];
    } else {
      throw new Error(`Expected metric to be an Array, got '${metric}' instead`);
    }
    this.collection = collection;
    this.metric = metric;
  }

  where(condition, operator) {
    if (! condition instanceof Condition)
      throw new Error("Invalid query condition");
    if (operator && this.condition) {
      condition = this.condition[operator](condition);
    }
    var selector = this._clone();
    selector.condition = condition;
    return selector;
  }

  andWhere(condition) {
    return this.where(condition, 'and');
  }

  orWhere(condition) {
    return this.where(condition, 'or');
  }

  shiftBy(offset) {
    var selector = this._clone(),
        timeshift = new Timeshift(offset);
    selector.timeshift = timeshift;
    return selector;
  }

  toString() {
    var metric = this._encodeMetric(),
        collection = this._encodeCollection(),
        str = `${metric} FROM ${collection}`;
    if (this.condition)
      str += ' WHERE ' + this.condition;
    if (this.timeshift)
      str += ' ' +  this.timeshift.toString();
    return str;
  }

  /**
   * Internal methods
   */

  _clone() {
    var selector = new Selector(this.collection, this.metric);
    if (this.condition) selector.condition = this.condition;
    if (this.timeshift) selector.timeshift = this.timeshift;
    return this;
  }

  _encodeCollection() {
    return `'${this.collection}'`;
  }

  _encodeMetric() {
    return this.metric.map(function(part) {
      if (isKeyword(part))
        return part;
      else
        return `'${part}'`;
    }).join('.');
  }
}
