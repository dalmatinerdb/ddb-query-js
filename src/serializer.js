
function objToJSON(obj, options) {
  var r = {},
      n, j;
  for (n of Object.getOwnPropertyNames(obj)) {
    if (options && options.except && options.except.indexOf(n) >= 0) {
      console.log('Skipping:' + n);
      continue;
    }
    j = toJSON(obj[n]);
    if (j !== void 0)
      r[n] = j;
  }
  return r;
}

function toJSON (obj, options) {
  switch (typeof obj) {
  case 'number':
  case 'string':
    return obj;
  case 'function':
    return undefined;
  case 'object':
    if (Array.isArray(obj))
      return obj.map(toJSON);
    return objToJSON(obj, options);
  };
  return undefined;
}

function fromJSON (schema, json) {
  var proto = schema.proto,
      ref = schema.ref,
      obj = Object.create(proto),
      n, o;
  Object.assign(obj, json);
  console.log('Building from:', proto);
  console.log('Built:', obj);

  for (n of Object.getOwnPropertyNames(obj)) {
    if (ref[n])
      if (Array.isArray(ref[n]))
        o = Array.prototype.map.call(json[n], fromJSON.bind(null, ref[n][0]));
      else
        o = fromJSON(ref[n], json[n]);
    else
      o = json[n];
    obj[n] = o;
  };
  return json;
}


var Serializer = {toJSON, fromJSON};
export default Serializer;
