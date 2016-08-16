export class Timeshift {

  constructor(subject, offset) {
    this.subject = subject;
    this.offset = offset;
  }

  toString() {
    return `${this.subject} SHIFT BY ${this.offset}`;
  }
}
