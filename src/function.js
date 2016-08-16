export class Function {

  constructor(fun, args, vars) {
    this.fun = fun;
    this.args = args;
    this.vars = vars;
    this._encodeArg = this._encodeArg.bind(this);
  }

  toString() {
    var args = this.args.map(this._encodeArg);
    return `${this.fun}(${args.join(', ')})`;
  }

  _encodeArg(arg) {
    if (typeof arg === 'string' && arg[0] === '$') {
      let varname = arg.slice(1);
      arg = this.vars[varname];
      if (arg === void 0) {
        throw new Error(`Variable ${varname} was not declared`);
      }
    }
    return '' + arg;
  }
}
