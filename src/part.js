import Selector from "./selector.js";
import Condition from "./condition.js";
import Alias from "./alias.js";
import Timeshift from "./timeshift.js";
import Function from "./function.js";


export default class Part {

  constructor(collection, metric) {
    this.selector = new Selector(collection, metric);
  }

  where(condition) {
    if (! condition instanceof Condition)
      throw new Error("Invalid query condition");
    var part = this._clone();
    part.condition = condition;
    return part;
  }

  labelBy(label) {
    var part = this._clone(),
        alias = part.alias ? part.alias.useLabel(label) : new Alias(label);
    part.alias = alias;
    return part;
  }

  shiftBy(offset) {
    var part = this._clone(),
        timeshift = new Timeshift(offset);
    part.timeshift = timeshift;
    return part;
  }

  apply(fun, args = []) {
    var part = this._clone(),
        fargs = [this._getSelector()].concat(args),
        fn = new Function(fun, fargs);
    part.fn = fn;
    return part;
  }

  prefixWith(prefix) {
    var part = this._clone(),
        alias = this.alias || new Alias();
    part.alias = alias.prefixWith(prefix);
    return part;
  }

  annotateWith(...tags) {
    var part = this._clone(),
        alias = this.alias || new Alias();
    part.alias = alias.annotateWith(...tags);
    return part;
  }

  toString(vars) {
    var str = this._getSelector().toString(vars);
    if (this.condition)
      str += ` WHERE ${this.condition}`;
    for (let stmt of ['timeshift', 'alias'])
      if (this[stmt]) {
        str += ' ' + this[stmt].toString();
      }
    return str;
  }

  /**
   * Internal methods
   */

  _clone() {
    var part = Object.create(Part.prototype);
    part.selector = this.selector;
    if (this.condition) part.condition = this.condition;
    if (this.alias) part.alias = this.alias;
    if (this.timeshift) part.timeshift = this.timeshift;
    if (this.fn) part.fn = this.fn;
    return part;
  }

  _getSelector() {
    return this.fn || this.selector;
  }
}
