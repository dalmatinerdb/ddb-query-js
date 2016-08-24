export default class Function {

  constructor(fun, args) {
    this.fun = fun;
    this.args = args;
    this._encodeArg = this._encodeArg.bind(this);
  }

  toString(vars) {
    var args = this.args.map((a) => this._encodeArg(a, vars));
    return `${this.fun}(${args.join(', ')})`;
  }

  _encodeArg(arg, vars) {
    if (typeof arg === 'string' && arg[0] === '$') {
      let varname = arg.slice(1);
      arg = vars[varname];
      if (arg === void 0) {
        throw new Error(`Variable ${varname} was not declared`);
      }
    }
    return '' + arg;
  }
}
