import Selector from "./selector.js";
import Alias from "./alias.js";
import Timeshift from "./timeshift.js";
import Function from "./function.js";


export default class Part {

  constructor(collection, metric) {
    this.selector = new Selector(collection, metric);
  }

  where(condition, operator) {
    var part = this._clone(),
        selector = this.selector.where(condition, operator);
    part.selector = selector;
    return part;
  }

  andWhere(condition) {
    return this.where(condition, 'and');
  }

  orWhere(condition) {
    return this.where(condition, 'or');
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
        fargs = [this.fn || '$__selector'].concat(args),
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
    var str = '' + this.selector;
    if (this.fn) {
      vars = {...vars, '__selector': this.selector};
      str = this.fn.toString(vars);
    }
    for (let stmt of this._getOuterStatements())
      str += ' ' + stmt.toString();
    return str;
  }

  /**
   * Internal methods
   */

  _clone() {
    var part = Object.create(Part.prototype);
    part.selector = this.selector;
    if (this.alias) part.alias = this.alias;
    if (this.timeshift) part.timeshift = this.timeshift;
    if (this.fn) part.fn = this.fn;
    return part;
  }

  _getOuterStatements() {
    var statements = [];
    for (let name of ['timeshift', 'alias'])
      if (this[name])
        statements.push(this[name]);
    return statements;
  }
}
