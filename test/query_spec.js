/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import source_map from 'source-map-support';
import Query from "./query";

source_map.install({handleUncaughtExceptions: false});
chai.use(sinonChai);

describe('Query', function() {
  var expect = chai.expect,
      query;

  beforeEach(function() {
    query = new Query();
  });

  describe('#equals', function() {

    it('should build a condition with name-space', function() {
      var c = Query.equals(['dl', 'source'], 'agent1');
      expect('' + c).to.be.equal("dl:'source' = 'agent1'");
    });

    it('should build a condition without name-space', function() {
      var c = Query.equals(['', 'custom'], 'some-value');
      expect('' + c).to.be.equal("'custom' = 'some-value'");
    });

    it('should build a condition that can be and-ed', function() {
      var c = Query.equals(['label', 'production'], '')
            .and(Query.equals(['label', 'web'], ''));
      expect('' + c).to.be.equal("label:'production' = '' AND label:'web' = ''");
    });

    it('should build a condition that can be or-ed', function() {
      var c = Query.equals(['label', 'production'], '')
            .or(Query.equals(['label', 'web'], ''));
      expect('' + c).to.be.equal("label:'production' = '' OR label:'web' = ''");
    });
  });

  describe('#not-equals', function() {

    it('should build a condition with name-space', function() {
      var c = Query.notEquals(['dl', 'source'], 'agent1');
      expect('' + c).to.be.equal("dl:'source' != 'agent1'");
    });

    it('should build a condition without name-space', function() {
      var c = Query.notEquals(['', 'custom'], 'some-value');
      expect('' + c).to.be.equal("'custom' != 'some-value'");
    });

    it('should build a condition that can be and-ed', function() {
      var c = Query.notEquals(['label', 'production'], '')
            .and(Query.notEquals(['label', 'web'], ''));
      expect('' + c).to.be.equal("label:'production' != '' AND label:'web' != ''");
    });

    it('should build a condition that can be or-ed', function() {
      var c = Query.notEquals(['label', 'production'], '')
            .or(Query.notEquals(['label', 'web'], ''));
      expect('' + c).to.be.equal("label:'production' != '' OR label:'web' != ''");
    });
  });


  describe('#present', function() {

    it('should build a condition checking presence of a tag', function() {
      var c = Query.present(['label', 'production']);
      expect('' + c).to.be.equal("label:'production'");
    });
  });

  describe('#select', function() {

    it('should be enough for simple query when combined with from statement', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu', 'system'])
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'myorg'");
    });

    it('should create multi part query when called multiple times', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu', 'system'])
        .select(['base', 'cpu', 'user'])
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'myorg', 'base'.'cpu'.'user' FROM 'myorg'");
    });

    it('should create selector for most recent collection', function() {
      expect(
        query.from('first-org')
        .select(['base', 'cpu', 'system'])
        .from('second-org')
        .select(['base', 'cpu', 'user'])
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'first-org', 'base'.'cpu'.'user' FROM 'second-org'");
    });

  });

  describe('#apply', function() {

    it('should apply function on active selection', function() {
      expect(
        query.from('myorg')
        .select(['base', 'network', 'eth0', 'sent'])
        .apply('derivate')
        .toString()
      ).to.be
        .equal("SELECT derivate('base'.'network'.'eth0'.'sent' FROM 'myorg')");
    });

    it('should support function with extra argument', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu'])
        .apply('avg', ['30s'])
        .toString()
      ).to.be
        .equal("SELECT avg('base'.'cpu' FROM 'myorg', 30s)");
    });

    it('should expand variables in function arguments', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu'])
        .with('interval', '30s')
        .apply('avg', ['$interval'])
        .toString()
      ).to.be
        .equal("SELECT avg('base'.'cpu' FROM 'myorg', 30s)");
    });

    it('should fail when variable is not defined', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu'])
        .apply('avg', ['$interval'])
        .toString
      ).to.throw(Error);
    });

    it('should allow for function chaining', function() {
      expect(
        query.from('myorg')
        .select(['base', 'network', 'eth0', 'sent'])
        .apply('derivate')
        .apply('sum', ['30s'])
        .toString()
      ).to.be
        .equal("SELECT sum(derivate('base'.'network'.'eth0'.'sent' FROM 'myorg'), 30s)");
    });

    it('should be applied only to last selection', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu', 'user'])
        .select(['base', 'cpu', 'system'])
        .apply('max', [])
        .select(['base', 'cpu', 'idle'])
        .apply('min', [])
        .toString()
      ).to.be.equal(
        "SELECT 'base'.'cpu'.'user' FROM 'myorg', " +
          "max('base'.'cpu'.'system' FROM 'myorg'), " +
          "min('base'.'cpu'.'idle' FROM 'myorg')"
      );
    });

  });

  describe.skip('#aliasBy', function() {

    it('should alias simple selectors with from statement', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu', 'system'])
        .aliasBy('$1')
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'myorg' AS $1");
    });

    it('should alias chained functions', function() {
      expect(
        query.from('myorg')
        .select(['base', 'network', 'eth0', 'sent'])
        .apply('derivate')
        .apply('sum', ['30s'])
        .aliasBy('$1')
        .toString()
      ).to.be
        .equal("SELECT sum(derivate('base'.'network'.'eth0'.'sent' FROM 'myorg'), 30s) AS $1");
    });

    it('should only alias selector for most recent collection', function() {
      expect(
        query.from('first-org')
        .select(['base', 'cpu', 'system'])
        .from('second-org')
        .select(['base', 'cpu', 'user'])
        .aliasBy('$1')
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'first-org', 'base'.'cpu'.'user' FROM 'second-org' AS $1");
    });

  });

  describe('#shiftBy', function() {

    it('should timeshift simple selectors with from statement', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu', 'system'])
        .shiftBy('1h')
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'myorg' SHIFT BY 1h");
    });

    it('should timeshift chained functions', function() {
      expect(
        query.from('myorg')
        .select(['base', 'network', 'eth0', 'sent'])
        .apply('derivate')
        .apply('sum', ['30s'])
        .shiftBy('1h')
        .toString()
      ).to.be
        .equal("SELECT sum(derivate('base'.'network'.'eth0'.'sent' FROM 'myorg'), 30s) SHIFT BY 1h");
    });

    it('should only timeshift selector for most recent collection', function() {
      expect(
        query.from('first-org')
        .select(['base', 'cpu', 'system'])
        .shiftBy('1h')
        .from('second-org')
        .select(['base', 'cpu', 'user'])
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'first-org' SHIFT BY 1h, 'base'.'cpu'.'user' FROM 'second-org'");
    });

    it('should timeshift selectors with an alias applied', function() {
      expect(
        query.from('first-org')
        .select(['base', 'cpu', 'system'])
        .shiftBy('1h')
        .annotateWith(['', 'region'])
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'first-org' SHIFT BY 1h AS $'region'");
    });
  });

  describe('#annotateWith', function() {
    it('should allow to build queries with tag annotations', function() {
      expect(
        query
          .from('best-org')
          .select(['base', 'cpu'])
          .annotateWith(['dl', 'hostname'],
                        ['dl', 'source'],
                        ['', 'custom'])
          .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu' FROM 'best-org' AS $dl:'hostname'.$dl:'source'.$'custom'");
    });
  });

  describe('#exec', function() {
    var ajax, xhr_mock;

    beforeEach(function() {
      xhr_mock = {
        then: sinon.spy(),
        abort: sinon.spy()
      },
      ajax = sinon.stub()
        .returns(xhr_mock);
    });
    
    it('should call ajax with default settings', function() {
      var xhr = query
            .from('some-org')
            .select(['base', 'cpu'])
            .last(10, 'minutes')
            .exec(ajax);
      expect(ajax).to.have.been.calledWith({
        url: 'http://localhost:8080',
        data: {
          q: "SELECT 'base'.'cpu' FROM 'some-org' AS '0' LAST 600s"
        },
        headers: {
          accept: 'application/json'
        }
      });
    });

    it('should allow for query with confidence mapping', function() {
      var xhr = query
            .from('some-org')
            .select(['base', 'cpu'])
            .apply('avg', ['10s'])
            .annotateWith(['dl', 'hostname'])
            .last(10, 'minutes')
            .exec(ajax, {applyConfidence: true});
      expect(ajax).to.have.been
        .calledWith(sinon.match(
          {data:
           {q: "SELECT " +
            "avg('base'.'cpu' FROM 'some-org', 10s) AS '0'.'v'.$dl:'hostname', " +
            "confidence(avg('base'.'cpu' FROM 'some-org', 10s)) AS '0'.'c'.$dl:'hostname' " +
            "LAST 600s"
           }}));
    });
  });
});
