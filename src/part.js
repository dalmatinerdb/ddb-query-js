import {clone, forward} from "./utils.js";
import Selector from "./selector.js";
import Annotations from "./annotations.js";
import Function from "./function.js";


// Selector methods that are exposed on part level
const SELECTOR_METHODS = [
  'where',
  'andWhere',
  'orWhere',
  'shiftBy'
];

// Annotations methods that are exposed on part level
const ANNOTATIONS_METHODS = [
  'labelBy',
  'annotateWith',
  'annotateWithStatic'
];

export default class Part {

  static __schema = {
    proto: Part.prototype,
    ref: {
      annotations: Annotations.__schema,
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

  toString(vars) {
    var str = '' + this.selector;
    if (this.fn) {
      vars = {...vars, '__selector': this.selector};
      str = this.fn.toString(vars);
    }
    if (this.annotations)
      str += ' ' + this.annotations.toString();
    return str;
  }

  /**
   * Internal methods
   */

  _updateSelector(method, args) {
    var selector = this.selector[method](...args),
        part = clone(this);
    part.selector = selector;
    return part;
  }

  _updateAnnotations(method, args) {
    var annotations = this.annotations || new Annotations(),
        part = clone(this);
    annotations = annotations[method](...args);
    part.annotations = annotations;
    return part;
  }
}


forward(Part.prototype, '_updateSelector', SELECTOR_METHODS);
forward(Part.prototype, '_updateAnnotations', ANNOTATIONS_METHODS);
