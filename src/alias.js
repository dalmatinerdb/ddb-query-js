export class Alias {

  constructor(subject, name) {
    this.subject = subject;
    this.name = name;
  }

  toString() {
    return `${this.subject} AS ${this.name}`;
  }
}
