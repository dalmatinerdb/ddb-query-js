import moment from "moment";

import Condition from "./condition.js";
import Part from "./part.js";
import Decoder from "./decoder.js";

// Part methods that are exposed to Query top level api
const PART_METHODS = [
  'where',
  'andWhere',
  'orWhere',
  'apply',
  'shiftBy',
  'labelBy',
  'annotateWith'
];


class AbortablePromise {

  constructor(promise, abort) {
    this.promise = promise;
    if (abort) {
      this.abort = abort;
    } else if (promise.abort) {
      this.abort = promise.abort.bind(promise);
    } else {
      throw new Error("Tried to initialise abort-able promise without abort handler"); 
    }
  }

  then(onFulfilled, onRejected) {
    return new AbortablePromise(this.promise.then(onFulfilled, onRejected),
                                this.abort);
  }

  catch(onRejected) {
    return new AbortablePromise(this.promise.catch(onRejected), this.abort);
  }
}


/**
 * DalmatinerDB Query builder.
 *
 * It provides chainable api to programatically assemble dalmatiner queries
 */
export default class Query {

  constructor() {
    this.parts = [];
    this.vars = {};
  }

  /**
   * Chain-able query generators
   *
   * Each one of them will generate new query
   */
  from(c) {
    var query = this._clone();
    query.collection = c.value ? c.value : c.toString();
    return query;
  }

  select(m) {
    if (! this.collection)
      throw new Error("You need to set collection (from statement) before selecting metric");

    var query = this._clone(),
        part = new Part(this.collection, m);

    query.parts = query.parts.concat(part);
    return query;
  }

  selectAll() {
    return this.select('ALL');
  }

  beginningAt(t) {
    var query = this._clone();
    query.beginning = moment(t);
    return query;
  }

  endingAt(t) {
    var query = this._clone();
    query.ending = moment(t);
    return query;
  }

  last(...args) {
    var query = this._clone();    
    query.duration = moment.duration(...args);
    query.beginning = null;
    query.ending = null;
    return query;
  }

  with(name, value) {
    this.vars[name] = value;
    return this;
  }

  /**
   * Non chain-able utilities
   */

  exec(ajax, options = {}) {
    var settings = {data: {}},
        query = this._clone(),
        parts = query.parts,
        decoder = null;

    if (! ajax)
      throw new Error("Missing ajax function");

    parts = parts.map((part, idx) => {
      return part.prefixWith(['' + idx]);
    });
    if (options.applyConfidence) {
      parts = parts.reduce(function(acc, part) {
        let prefix = part.alias.prefix,
            vpart = part.prefixWith(prefix.concat('v')),
            cpart = part.prefixWith(prefix.concat('c'))
              .apply('confidence');
        return acc.concat(vpart, cpart);
      }, []);
    }
    query.parts = parts;
    decoder = new Decoder(query, options),
    settings.data.q = query.toString();
    
    if (! options.url)
      settings.url = 'http://localhost:8080'; // Default url

    if (! (options.headers && options.headers.accept)) {
      if (! settings.headers) {
        settings.headers = {};
      }
      // TODO: add msgpack optional decoding, when msgpack-lite is reachable
      settings.headers.accept = 'application/json';
    }

    Object.assign(settings, options);
    return new AbortablePromise(ajax(settings))
      .then(decoder.decode);
  }

  /**
   * Reading methods
   */

  lastPart() {
    var len = this.parts.length;
    return this.parts[len - 1];
  }

  toString() {
    var parts = this._encodeParts().join(', '),
        range = this._encodeRange(),
        str = 'SELECT ' + parts;
    if (range)
      str += ' ' + range;
    return str;
  }

  /**
   * Internal methods
   */

  _clone() {
    var query = Object.create(Query.prototype);
    Object.assign(query, this);
    return query;
  }

  _updatePart(method, ...args) {
    if (this.parts.length === -1) 
      throw new Error("You need to select something before doing any futher operations");

    var parts = this.parts.concat(),
        lastIdx = parts.length - 1,
        last = parts[lastIdx],
        query = this._clone(); 

    parts[lastIdx] = last[method](...args);
    query.parts = parts;
    return query;
  }

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
    var vars = this.vars;
    return this.parts.map(p => { return p.toString(vars); });
  }
};


PART_METHODS.forEach(function(method) {
  Query.prototype[method] = function (...args) {
    return this._updatePart(method, ...args);
  };
});
