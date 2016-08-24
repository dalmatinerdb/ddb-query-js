export default class Timeshift {

  constructor(offset) {
    this.offset = offset;
  }

  toString() {
    return `SHIFT BY ${this.offset}`;
  }
}
