import moment from "moment";

import {clone} from "./utils.js";
import Condition from "./condition.js";
import Part from "./part.js";
import Decoder from "./decoder.js";
import Serializer from "./serializer.js";

// Part methods that are exposed to Query top level api
const PART_METHODS = [
  'where',
  'andWhere',
  'orWhere',
  'apply',
  'shiftBy',
  'nameBy',
  'labelBy',
  'annotateWith',
  'exclude',
  'include'
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

  static __schema = {
    proto: Query.prototype,
    ref: {
      parts: [Part.__schema],
      beginning: 'moment',
      ending: 'moment',
      duration: 'duration'
    },
    ignore: ['vars']
  };

  constructor() {
    this.parts = [];
  }

  /**
   * Chain-able query generators
   *
   * Each one of them will generate new query
   */
  from(c) {
    var query = clone(this);
    query.collection = c.value ? c.value : c.toString();
    return query;
  }

  select(m) {
    if (! this.collection)
      throw new Error("You need to set collection (from statement) before selecting metric");

    var query = clone(this),
        part = new Part(this.collection, m);

    query.parts = query.parts.concat(part);
    return query;
  }

  selectAll() {
    return this.select('ALL');
  }

  beginningAt(t) {
    var query = clone(this);
    query.beginning = moment(t);
    return query;
  }

  endingAt(t) {
    var query = clone(this);
    query.ending = moment(t);
    return query;
  }

  last(...args) {
    var query = clone(this);
    query.duration = moment.duration(...args);
    query.beginning = null;
    query.ending = null;
    return query;
  }

  with(name, value) {
    if (! this.vars) this.vars = {};
    this.vars[name] = value;
    return this;
  }

  /**
   * Non chain-able utilities
   */

  exec(ajax, options = {}, wrapWithAbortable = true) {
    var settings = {data: {}},
        query = clone(this),
        parts = query.parts,
        decoder = null,
        request;

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
    request = ajax(settings);
    return (wrapWithAbortable ? new AbortablePromise(request) : request)
      .then(decoder.decode);
  }

  /**
   * Reading methods
   */

  lastPart() {
    var len = this.parts.length;
    return this.parts[len - 1];
  }

  toString(vars) {
    var parts = this._encodeParts(vars).join(', '),
        range = this._encodeRange(),
        str = 'SELECT ' + parts;
    if (range)
      str += ' ' + range;
    return str;
  }

  toJSON() {
    return Serializer.toJSON(this);
  }

  /**
   * Internal methods
   */

  _updatePart(method, ...args) {
    if (this.parts.length === -1) 
      throw new Error("You need to select something before doing any futher operations");

    var parts = this.parts.concat(),
        lastIdx = parts.length - 1,
        last = parts[lastIdx],
        query = clone(this);

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

  _encodeParts(vars) {
    var vs = this._defaultVars(),
        encoded = [];
    if (this.vars)
      Object.assign(vs, this.vars);
    if (vars)
      Object.assign(vs, vars);

    for (let part of this.parts){
      if (! part.excluded)
        encoded.push(part.toString(vs));
    };
    return encoded;
  }

  _defaultVars() {
    var vars = {};
    for (let part of this.parts) {
      if (part.name)
        vars[part.name] = part;
    }
    return vars;
  }
};


PART_METHODS.forEach(function(method) {
  Query.prototype[method] = function (...args) {
    return this._updatePart(method, ...args);
  };
});
