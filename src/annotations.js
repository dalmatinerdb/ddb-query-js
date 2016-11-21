import {clone} from "./utils.js";


export default class Annotations {

  static __schema = {
    proto: Annotations.prototype
  };

  constructor(label) {
    if (label !== void 0) this.label = label;
  }

  labelBy(label) {
    var annotations = clone(this);
    annotations.label = label;
    return annotations;
  }

  annotateWith(...tags) {
    var annotations = clone(this);
    tags = tags.map(normalizeTag);
    annotations.tags = this.tags ? this.tags.concat(tags) : tags;
    return annotations;
  }

  annotateWithStatic(fields, maybe_value) {
    if (typeof fields === 'string')
      return this.annotateWithStatic({[fields]: maybe_value});

    var annotations = clone(this);
    fields = Object.assign({}, this['static'], fields);
    annotations['static'] = fields;
    return annotations;
  }

  /*
   * Reading methods
   */

  get(key) {
    return this.static[key];
  }

  toString() {
    return `AS ${this._encode()}`;
  }

  _encode() {
    // Prefix is special static variable that is used for matching responses
    var sections = this.static && this.static.__prefix || [];
    if (this.tags)
      sections = sections.concat(this.tags);
    if (this.label)
      sections = sections.concat(this.label);
    return sections.map(encodeSection).join('.');
  }
}

function encodeName(name) {
  if (name[0] != '$' &&
      (name[0] != '\'' ||
       name[name.length - 1] != '\'')) {
    name = name.replace(/(['\\])/g, '\$1');
    return `'${name}'`;
  }
  return name;
}

function encodeSection(section) {
  if (Array.isArray(section)) {
    let [ns, name] = section;
    if (ns)
      return `\$${ns}:${encodeName(name)}`;
    else
      return `\$${encodeName(name)}`;
  }
  return encodeName(section);
}

function normalizeTag(tag) {
  if (typeof tag === 'string') {
    let m = tag.match(/^(([a-z]*):)?(.*)$/);
    if (! m)
      throw new Error("Invalid annotations variable: " + tag);
    let ns = m[2],
        name = m[3];
    return [ns, name];
  }
  return tag;
}
