import moment from "moment";


export default class Decoder {

  constructor(query, options) {
    this.decode = (r) => decode(query, r, options);
  };
}


function decode(query, resp, options = {}) {
  var {s, t, d} = resp,
      //parts = query.parts,
      start = moment(s * 1000),
      series = [];

  series = Array.prototype.map.call(d, function({n, r, v}) {
    return {
      name: n,
      points: decodePoints(v, start.valueOf(), r)
    };
  });
  return {start, series};
}


function decodePoints(values, start, increment) {
  var r = new Array(values.length);
  for (var i = 0; i < values.length; i++) {
    r[i] = [values[i], start + (i * increment)];
  }
  return r;
}
