import moment from "moment";


export default class Decoder {

  constructor(query, options) {
    this.decode = (r) => decode(query, r, options);
  };
}


function decode(query, resp, options = {}) {
  var {s, t, d} = resp,
      parts = query ? query.parts : [],
      start = moment(s * 1000),
      series = [];

  series = Array.prototype.map.call(d, function({n, r, v}) {
    var sections = decodeN(n),
        idx = parseInt(sections[0]),
        qpart = parts[idx],
        name;

    if (qpart.alias && qpart.alias.label) {
      name = qpart.alias.label;
    } else {
      name = qpart.selector.toString();
    }

    return {qpart, name,
            points: decodePoints(v, start.valueOf(), r)};
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


function decodeN(n) {
  return n.split('.').map(decodeNSection);
}


function decodeNSection(section) {
  if (section[0] == "'" && section[section.length - 1] == "'") {
    section = section.slice(1, -1);
  }
  return section;
}
