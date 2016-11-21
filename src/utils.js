/**
 * Miscellaneous utilities
 */

export function clone(obj) {
  var proto = Object.getPrototypeOf(obj),
      c = Object.create(proto);
  Object.assign(c, obj);
  return c;
}


export function forward(proto, target, methods) {
  for (let method of methods) {
    proto[method] = function(...args) {
      return this[target](method, args);
    };
  }
}
