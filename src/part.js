import {clone} from "./utils.js";
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

  static __schema = {
    proto: Part.prototype,
    ref: {
      alias: Alias.__schema,
      selector: Selector.__schema,
      fn: Function.__schema
    }
  };

  constructor(collection, metric) {
    this.selector = new Selector(collection, metric);
  }

  apply(fun, args = []) {
    var part = clone(this),
        fargs = [this.fn || '$__selector'].concat(args),
        fn = new Function(fun, fargs);
    part.fn = fn;
    return part;
  }

  nameBy(name) {
    var part = clone(this);
    part.name = name;
    return part;
  }

  labelBy(label) {
    var part = clone(this),
        alias = part.alias ? part.alias.useLabel(label) : new Alias(label);
    part.alias = alias;
    return part;
  }

  prefixWith(prefix) {
    var part = clone(this),
        alias = this.alias || new Alias();
    part.alias = alias.prefixWith(prefix);
    return part;
  }

  annotateWith(...tags) {
    var part = clone(this),
        alias = this.alias || new Alias();
    part.alias = alias.annotateWith(...tags);
    return part;
  }

  exclude() {
    if (this.excluded)
      return this;

    var part = clone(this);
    part.excluded = true;
    return part;
  }

  include() {
    if (! this.hasOwnProperty('excluded'))
      return this;

    var part = clone(this);
    delete part.excluded;
    return part;
  }

  toString(vars, options = {includeAlias: true}) {
    var str = '' + this.selector;
    if (this.fn) {
      vars = {...vars, '__selector': this.selector};
      str = this.fn.toString(vars);
    }
    if (this.alias && options.includeAlias)
      str += ' ' + this.alias.toString();
    return str;
  }

  /**
   * Internal methods
   */

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
