import moment from "moment";

import {Condition} from "./condition.js";
import {Selector} from "./selector.js";
import {Function} from "./function.js";
import {Alias} from "./alias.js";
import {Timeshift} from "./timeshift.js";


/**
 * DalmatinerDB Query builder.
 *
 * It provides chainable api to programatically assemble dalmatiner queries
 *
 * TODO: Make query immutable, so we can use it in layered fashion
 */
export class Query {

  constructor() {
    this.variables = {};
    this.parts = [];
    this.selectors = [];
  }

  // TODO: maybe this statics should end up on main index level
  static equals(a, b) {
    return new Condition('eq', a, b);
  }

  static notEquals(a, b) {
    return new Condition('neq', a, b);
  }

  static present(a) {
    return new Condition('present', a);
  }

  /**
   * Chain-able setters
   */
  from(c) {
    this.collection = c.value ? c.value : c.toString();
    return this;
  }

  select(m) {
    if (! this.collection)
      throw new Error("You need to set collection (from statement) before selecting metric");
    var selector = new Selector(this.collection, m);
    this.selectors.push(selector);
    this.parts.push(selector);
    this.active = this.parts.length - 1;
    return this;
  }

  beginningAt(t) {
    this.beginning = moment(t);
    return this;
  }

  endingAt(t) {
    this.ending = moment(t);
    return this;
  }

  last(...args) {
    this.duration = moment.duration(...args);
    this.beginning = null;
    this.ending = null;
    return this;
  }

  with(name, value) {
    this.variables[name] = value;
    return this;
  }

  where(condition) {
    if (! condition instanceof Condition) {
      throw new Error("Invalid query condition");
    }
    this.selectors[this.active].where(condition);
    return this;
  }

  aliasBy(name) {
    if (this.active === void 0)
      throw new Error("You need to select something before you can alias it");

    var part = this.parts[this.active],
        alias = new Alias(part, name);

    this.parts[this.active] = alias;
    return this;
  }

  shiftBy(offset) {
    if (this.active === void 0)
      throw new Error("You need to select something before you can shift it");

    var part = this.parts[this.active],
        timeshift = new Timeshift(part, offset);
    
    this.parts[this.active] = timeshift;
    return this;
  }

  apply(fun, args = []) {
    if (this.active === void 0)
      throw new Error("You need to select something before you can apply functions");

    var part = this.parts[this.active],
        fargs = [part].concat(args),
        f;

    if (! (part instanceof Function ||
           part instanceof Selector)) {
      throw new Error("You can't apply more function once you have added alias or time shift");
    }

    f = new Function(fun, fargs, this.variables);
    this.parts[this.active] = f;
    return this;
  }

  exec(ajax, options = {}) {
    var q = this.toString(),
        settings = {data: {q: q}};

    if (! ajax)
      throw new Error("Missing ajax function");
    
    if (! options.url)
      settings.url = 'http://localhost:8080'; // Default url

    // TODO: add msgpack optional decoding, when msgpack-lite is reachable

    if (! (options.headers && options.headers.accept)) {
      if (! settings.headers) {
        settings.headers = {};
      }
      settings.headers.accept = 'application/json';
    }

    Object.assign(settings, options);
    return ajax(settings)
      .then((resp) => {
        console.log('Recived response:', resp);
        return resp;
      });
  }

  /**
   * Reading methods
   */

  toString() {
    return this.toUserString() + ' ' + this._encodeRange();
  }

  toUserString() {
    return 'SELECT ' + this._encodeParts().join(', ');
  }

  /**
   * Internal methods
   */

  _encodeTime(m) {
    return m.utc().format('"YYYY-MM-DD HH:mm:ss"');
  }

  _encodeDuration() {
    var inSecs = Math.max(Math.round(this.duration.asSeconds()), 1);

    return inSecs + 's';
  }

  _encodeRange() {
    if (this.ending && this.beginning) {
      let start = this._encodeTime(this.beginning),
          end = this._encodeTime(this.ending);
      return `BETWEEN ${start} AND ${end}`;
    } else if (this.ending && this.duration) {
      let end = this._encodeTime(this.ending),
          duration = this._encodeDuration();
      return `BEFORE ${end} FOR ${duration}`;
    } else if (this.beginning && this.duration) {
      let start = this._encodeTime(this.beginning),
          duration = this._encodeDuration();
      return `AFTER ${start} FOR ${duration}`;
    } else if (this.duration) {
      return `LAST ${this._encodeDuration()}`;
    }
    return '';
  }

  _encodeParts() {
    return this.parts.map(p => { return p.toString(); });
  }
};
