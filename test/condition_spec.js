/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import source_map from 'source-map-support';
import Condition from "./condition";

source_map.install({handleUncaughtExceptions: false});
chai.use(sinonChai);


describe('Condition', function() {
  var expect = chai.expect;

  describe('#constructor', function() {

    it('should build a condition with name-space', function() {
      var c = new Condition('eq', ['dl', 'source'], 'agent1');
      expect('' + c).to.be.equal("dl:'source' = 'agent1'");
    });

    it('should build a condition without name-space', function() {
      var c = new Condition('eq', ['', 'custom'], 'some-value');
      expect('' + c).to.be.equal("'custom' = 'some-value'");
    });

    it('should build a condition that can be and-ed', function() {
      var c = new Condition('eq', ['label', 'production'], '')
          .and(new Condition('eq',['label', 'web'], ''));
      expect('' + c).to.be.equal("label:'production' = '' AND label:'web' = ''");
    });

    it('should build a condition that can be or-ed', function() {
      var c = new Condition('eq', ['label', 'production'], '')
          .or(new Condition('eq', ['label', 'web'], ''));
      expect('' + c).to.be.equal("label:'production' = '' OR label:'web' = ''");
    });

    it('should build a not equals condition', function() {
      var c = new Condition('neq', ['dl', 'source'], 'agent1');
      expect('' + c).to.be.equal("dl:'source' != 'agent1'");
    });

    it('should build a condition checking presence of a tag', function() {
      var c = new Condition('present', ['label', 'production']);
      expect('' + c).to.be.equal("label:'production'");
    });
  });
});
