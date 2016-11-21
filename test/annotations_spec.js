/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import Annotations from "./annotations";

source_map.install({handleUncaughtExceptions: false});


describe('Annotations', function() {
  var expect = chai.expect,
      annotations = null;

  beforeEach(function() {
    annotations = new Annotations();
  });

  describe('#annotateWith', function() {

    it('should add tag to constructed annotations', function() {
      expect(
        annotations
          .annotateWith(['dl', 'internal'])
          .toString()
      ).to.be
        .equal("AS $dl:'internal'");
    });

    it('should work with annotations', function() {
      expect(
        new Annotations('custom-label')
          .annotateWith(['dl', 'internal'])
          .toString()
      ).to.be
        .equal("AS $dl:'internal'.'custom-label'");
    });

    it('should use shorter representation for tags in default namespace', function() {
      expect(
        annotations
          .annotateWith(['', 'custom-dimension'])
          .toString()
      ).to.be
        .equal("AS $'custom-dimension'");
    });

    it('should allow for multiple tags', function() {
      expect(
        annotations
          .annotateWith(['dl', 'hostname'],
                        ['dl', 'source'])
          .toString()
      ).to.be
        .equal("AS $dl:'hostname'.$dl:'source'");

    });

    it('should parse tags provided in query variable format', function() {
      expect(
        annotations
          .annotateWith('custom')
          .toString()
      ).to.be
        .equal("AS $'custom'");
    });
  });
});
