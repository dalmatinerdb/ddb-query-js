/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import Alias from "./alias";

source_map.install({handleUncaughtExceptions: false});


describe('Alias', function() {
  var expect = chai.expect,
      alias = null;

  beforeEach(function() {
    alias = new Alias();
  });

  describe('#annotateWith', function() {

    it('should add tag to constructed alias', function() {
      expect(
        alias
          .annotateWith(['dl', 'internal'])
          .toString()
      ).to.be
        .equal("AS $dl:'internal'");
    });

    it('should work with alias', function() {
      expect(
        new Alias('custom-label')
          .annotateWith(['dl', 'internal'])
          .toString()
      ).to.be
        .equal("AS $dl:'internal'.'custom-label'");
    });

    it('should use shorter representation for tags in default namespace', function() {
      expect(
        alias
          .annotateWith(['', 'custom-dimension'])
          .toString()
      ).to.be
        .equal("AS $'custom-dimension'");
    });

    it('should allow for multiple tags', function() {
      expect(
        alias
          .annotateWith(['dl', 'hostname'],
                        ['dl', 'source'])
          .toString()
      ).to.be
        .equal("AS $dl:'hostname'.$dl:'source'");

    });

    it('should parse tags provided in query variable format', function() {
      expect(
        alias
          .annotateWith('$custom')
          .toString()
      ).to.be
        .equal("AS $'custom'");
    });

    it.skip('should de-duplicate tags');
  });
});
