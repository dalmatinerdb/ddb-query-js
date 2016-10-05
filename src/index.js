import Query from "./query.js";
import Condition from "./condition.js";

export var query = new Query();

export function equals(a, b) {
  return new Condition('eq', a, b);
}

export function notEquals(a, b) {
  return new Condition('neq', a, b);
}

export function present(a) {
  return new Condition('present', a);
}
