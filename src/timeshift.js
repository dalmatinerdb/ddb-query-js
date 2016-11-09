export default class Timeshift {

  static __schema = {
    proto: Timeshift.prototype
  };

  constructor(offset) {
    this.offset = offset;
  }

  toString() {
    return `SHIFT BY ${this.offset}`;
  }
}
