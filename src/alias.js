export default class Alias {

  constructor(label) {
    if (label !== void 0) this.label = label;
    this.tags = [];
  }

  useLabel(label) {
    var alias = this._clone();
    alias.label = label;
    return alias;
  }
  
  prefixWith(prefix) {
    var alias = this._clone();
    alias.prefix = prefix;
    return alias;
  }

  annotateWith(...tags) {
    var alias = this._clone();
    tags = tags.map(normalizeTag);
    alias.tags = dedupTags(this.tags.concat(tags));
    return alias;
  }

  toString() {
    return `AS ${this._encode()}`;
  }

  _clone() {
    var alias = Object.create(Alias.prototype);
    alias.tags = this.tags;
    if (this.label) alias.label = this.label;
    if (this.prefix) alias.prefix = this.prefix;
    return alias;
  }

  _encode() {
    var sections = this.prefix || [];
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
    let m = tag.match(/^\$(([a-z]*):)?(.*)$/);
    if (! m)
      throw new Error("Invalid alias variable: " + tag);
    let ns = m[2],
        name = m[3];
    return [ns, name];
  }
  return tag;
}

function dedupTags(tags) {
  return tags;
}
