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
      //matched = new Array(parts.length),
      matched = {},
      series;

  // First pass is to decode name and eventually match values and confidence channels
  Array.prototype.forEach.call(d, function({n, r, v}) {
    var sections = decodeN(n),
        idx = parseInt(sections.shift()),
        channel = 'v',
        increment = 0,
        keyPrefix,
        key;

    if (options.applyConfidence)
      channel = sections.shift();

    // Confidence and value channels are matched on combination of query index and
    // extra meta-data sections. On top of that we add increment, so we can match
    // in a situation that there is multiple series coming with the same meta data.
    // In that case they will be matched based on order of appearance.
    keyPrefix = [idx].concat(sections, '').join('.');
    key = keyPrefix + increment;
    while (matched[key] && matched[key][channel]) {
      increment += 1;
      key = keyPrefix + increment;
    }
 
    if (! matched[key]) {
      matched[key] = {sections, r,
                      qpart: parts[idx]};
    } else {
      if (matched[key].r != r)
        throw new Error("Values and confidence data came in different resolution");
    }
    matched[key][channel] = v;
  }, []);

  // Second pass is to do actual decoding
  series = Object.keys(matched).map(function(key) {
    let {sections, qpart, r, v, c} = matched[key],
        tagDefinitions = qpart.alias && qpart.alias.tags || [],
        tags = {},
        name;

    if (! v)
      throw new Error("Missing data channel in response to: " + qpart);
    
    if (qpart.alias && qpart.alias.label) {
      name = qpart.alias.label;
    } else {
      name = qpart.selector.toString();
    }

    for (let i = 0; i < tagDefinitions.length; i++) {
      let tag = tagDefinitions[i];
      tags[tagKey(tag)] = sections[i];
    }

    return {qpart, name, tags,
            points: decodePoints(v, c, start.valueOf(), r)};
  });
  return {start, series};
}


function decodePoints(values, confidence, start, increment) {
  return confidence?
    decodeConfidencePoints(values, confidence, start, increment) :
    decodeContinousPoints(values, start, increment);
}


function decodeContinousPoints(values, start, increment) {
  var r = new Array(values.length);
  for (var i = 0; i < values.length; i++) {
    r[i] = [values[i], start + (i * increment)];
  }
  return r;
}


function decodeConfidencePoints(values, confidence, start, increment) {
  var r = new Array();
  for (var i = 0; i < values.length; i++) {
    if (confidence[i] > 0) {
      r.push([values[i], start + (i * increment)]);
    }
  }
  return r;
}


function decodeN(n) {
  return n.split('.').map(decodeNSection);
}


function decodeNSection(section) {
  if (section[0] == "'" && section[section.length - 1] == "'") {
    section = section.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return section;
}

function tagKey(tag) {
  if (Array.isArray(tag)) {
    if (tag[0])
      return `${tag[0]}:${tag[1]}`;
    return tag[1];
  }
  return tag;
}
