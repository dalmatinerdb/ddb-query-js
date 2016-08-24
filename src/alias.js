export default class Alias {

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `AS ${this.name}`;
  }
}
