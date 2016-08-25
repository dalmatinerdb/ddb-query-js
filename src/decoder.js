import moment from "moment";


export default class Decoder {

  constructor(query, options) {
    this.decode = (r) => decode(query, r, options);
  };
}


function decode(query, resp, options) {
  var {s, t, d} = resp,
      parts = query.parts,
      start = moment(s * 1000),
      series = [];

  series = Array.prototype.map.call(d, function() {
  });
  return {start, series};
}
