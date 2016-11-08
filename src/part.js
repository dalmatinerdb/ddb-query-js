import Selector from "./selector.js";
import Alias from "./alias.js";
import Function from "./function.js";


// Selector methods that are exposed on part level
const SELECTOR_METHODS = [
  'where',
  'andWhere',
  'orWhere',
  'shiftBy'
];


export default class Part {

  constructor(collection, metric) {
    this.selector = new Selector(collection, metric);
  }

  apply(fun, args = []) {
    var part = this._clone(),
        fargs = [this.fn || '$__selector'].concat(args),
        fn = new Function(fun, fargs);
    part.fn = fn;
    return part;
  }


  labelBy(label) {
    var part = this._clone(),
        alias = part.alias ? part.alias.useLabel(label) : new Alias(label);
    part.alias = alias;
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
    if (this.alias)
      str += ' ' + this.alias.toString();
    return str;
  }

  /**
   * Internal methods
   */

  _clone() {
    var part = Object.create(Part.prototype);
    part.selector = this.selector;
    if (this.alias) part.alias = this.alias;
    if (this.fn) part.fn = this.fn;
    return part;
  }

  _updateSelector(method, ...args) {
    var selector = this.selector[method](...args);
    this.selector = selector;
    return this;
  }
}


SELECTOR_METHODS.forEach(function(method) {
  Part.prototype[method] = function (...args) {
    return this._updateSelector(method, ...args);
  };
});
