/*global describe, it, beforeEach*/

import chai from 'chai';
import source_map from 'source-map-support';
import * as api from "./index";

source_map.install({handleUncaughtExceptions: false});


describe('Serializer', function() {
  var expect = chai.expect,
      query = api.query;

  describe('#toJSON -> #fromJSON', function() {
    const QUERIES = [
      query.from('my-org').select(['base', 'cpu']),

      query.from('my-org')
        .select(['base', 'cpu'])
        .andWhere(api.present(['label', 'prod']))
        .andWhere(api.present(['label', 'app']))
        .orWhere(api.equals(['dl', 'source'], 'my-agent')),

      query.from('my-org')
        .select(['base', 'cpu'])
        .where(api.present(['label', 'prod']))
        .shiftBy('1d')
        .select(['base', 'cpu']),

      query.from('my-org')
        .select(['base', 'cpu'])
        .labelBy('cpu [%]')
        .annotateWith(['dl', 'hostname'])
        .annotateWith(['dl', 'uom']),

      query.from('my-org')
        .select(['base', 'cpu'])
        .beginningAt("2016-11-08 12:00")
        .endingAt("2016-11-08 16:00"),

      query.from('my-org')
        .select(['base', 'cpu'])
        .last(1, 'day'),

      query.from('my-org')
        .select(['base', 'cpu'])
        .apply('avg', ['30s'])
        .apply('sum'),

      query.from('my-org')
        .select(['base', 'cpu'])
        .apply('avg', ['$interval'])
        .apply('sum')
        .with('interval', '15s'),

      query.from('my-org')
        .select(['base', 'cpu', 'excluded'])
        .exclude()
        .select(['base', 'cpu', 'included'])
    ];

    for (let q of QUERIES) {
      let qstring = q.toString();
      it(`should work with query: ${qstring}`, function() {
        expect(api.fromJSON(q.toJSON()).toString(q.vars))
          .to.be.equal(qstring);
      });
    }
  });
  describe('toJSON', function(){
    it('should serialize excluded to JSON', function () {

      expect(
        query.from('myorg').select(['base', 'cpu'])
          .exclude().toJSON()
      ).to.deep
        .equal({
          "collection": "myorg",
          "parts": [{
            "excluded": true,
            "selector": {
              "collection": "myorg",
              "metric": ["base", "cpu"]
            }
          }]
        });
    });
  });
});
