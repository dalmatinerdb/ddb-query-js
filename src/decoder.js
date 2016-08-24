import moment from "moment";


function decode(query, resp) {
  var {s, t, d} = resp,
      start = moment(s * 1000);
  
  return resp;
}


export default class Decoder {

  constructor(query) {
    this.decode = (r) => decode(query, r);
  };
}
