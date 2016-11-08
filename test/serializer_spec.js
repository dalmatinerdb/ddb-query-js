/*global describe, it, beforeEach*/

import chai from 'chai';
import source_map from 'source-map-support';
import {query, fromJSON} from "./index";

source_map.install({handleUncaughtExceptions: false});


describe('Serializer', function() {
  var expect = chai.expect;

  describe.only('#toJSON -> #fromJSON', function() {
    const QUERIES = [
      query.from('my-org').select(['base', 'cpu'])
    ];

    for (let q of QUERIES) {
      it('should work with query: ' + q.toString(), function() {
        expect(fromJSON(q.toJSON()))
          .to.be.deep.equal(q);
      });
    }
  });
});
