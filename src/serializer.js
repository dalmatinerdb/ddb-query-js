import moment from "moment";


function objToJSON(obj, options) {
  var schema = Object.getPrototypeOf(obj).constructor.__schema,
      r = {},
      n, j;

  for (n of Object.getOwnPropertyNames(obj)) {
    if (schema && schema.ignore && schema.ignore.indexOf(n) >= 0) {
      continue;
    }
    j = anyToJSON(obj[n]);
    if (j !== void 0)
      r[n] = j;
  }
  return r;
}


function anyToJSON (obj) {
  switch (typeof obj) {
  case 'number':
  case 'string':
    return obj;
  case 'function':
    return undefined;
  case 'object':
    if (obj === null)
      return undefined;
    if (typeof obj.toJSON === 'function')
      return obj.toJSON();
    if (Array.isArray(obj))
      return obj.map(anyToJSON);
    return objToJSON(obj);
  };
  return undefined;
}


function objFromJSON (schema, json) {
  var proto = schema.proto,
      ref = schema.ref,
      obj = Object.create(proto),
      n, o;

  Object.assign(obj, json);

  for (n of Object.getOwnPropertyNames(obj)) {
    if (ref && ref[n])
      o = objFromRefedJSON(ref[n], json[n]);
    else
      o = json[n];
    obj[n] = o;
  };
  return obj;
}

// Ref can be a schema, an array of refs or a function returning ref, or a class
// identifier
function objFromRefedJSON(ref, json) {
  if (! ref)
    return json;

  if (typeof ref === 'function')
    return objFromRefedJSON(ref(json), json);

  if (Array.isArray(ref))
    return Array.prototype.map.call(json, objFromRefedJSON.bind(null, ref[0]));

  if (ref === "moment")
    return moment(json);

  if (ref === "duration")
    return moment.duration(json);

  return objFromJSON(ref, json);
}


var Serializer = {
  toJSON: objToJSON,
  fromJSON: objFromJSON
};

export default Serializer;
