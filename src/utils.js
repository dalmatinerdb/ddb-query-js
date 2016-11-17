/**
 * Miscellaneous utilities
 */

export function clone(obj) {
  var proto = Object.getPrototypeOf(obj),
      c = Object.create(proto);
  Object.assign(c, obj);
  return c;
}
