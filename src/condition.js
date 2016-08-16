export class Condition {

  constructor (op, ...args) {
    this.op = op;
    this.args = args;
  }

  and (other) {
    return new Condition('and', this, other);
  }

  or (other) {
    return new Condition('or', this, other);
  }

  toString() {
    var tag, value, a, b;
    switch (this.op) {
    case ('eq'):
      [tag, value] = this.args;
      return `${this._encodeTag(tag)} = '${value}'`;
    case ('neq'):
      [tag, value] = this.args;
      return `${this._encodeTag(tag)} != '${value}'`;
    case ('present'):
      [tag] = this.args;
      return this._encodeTag(tag);
    case ('and'):
      [a, b] = this.args;
      return `${a} AND ${b}`;
    case ('or'):
      [a, b] = this.args;
      return `${a} OR ${b}`;
    }
    return '';
  }

  _encodeTag([ns, key]) {
    return ns ? `${ns}:'${key}'` : `'${key}'`;
  }
}
