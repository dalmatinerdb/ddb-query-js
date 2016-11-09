export default class Function {

  static __schema = {
    proto: Function.prototype,
    ref: {
      args: [function(context) {
        if (typeof context === 'object' &&
            context.fun !== void 0 &&
            context.args !== void 0)
          return Function.__schema;
        return null;
      }]
    }
  };

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
      if (arg === void 0)
        throw new Error(`Variable ${varname} was not declared`);
      if (typeof arg.toString === 'function')
        arg = arg.toString(vars);
    } else if (typeof arg === 'object' && typeof arg.toString == 'function') {
      arg = arg.toString(vars);
    }
    return '' + arg;
  }
}
