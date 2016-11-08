/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import source_map from 'source-map-support';
import Query from "./query";
import * as api from "./index";

source_map.install({handleUncaughtExceptions: false});
chai.use(sinonChai);


describe('Query', function() {
  var expect = chai.expect,
      query;

  beforeEach(function() {
    query = new Query();
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

    it('should allow for ALL selector', function() {
      expect(
        query.from('myorg')
          .selectAll()
        .toString()
      ).to.be
        .equal("SELECT ALL FROM 'myorg'");
    });
  });

  describe('#where', function() {

    it('should add where clause to selector', function() {
      expect(
        query.from('my-org')
          .select(['base', 'cpu'])
          .where(api.equals(['dl', 'source'], 'my-agent'))
          .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu' FROM 'my-org' WHERE dl:'source' = 'my-agent'");
    });

    it('should add where clauses inside function call', function() {
      expect(
        query.from('my-org')
          .select(['base', 'cpu'])
          .apply('derivate')
          .where(api.equals(['dl', 'source'], 'my-agent'))
          .toString()
      ).to.be
        .equal("SELECT derivate('base'.'cpu' FROM 'my-org' WHERE dl:'source' = 'my-agent')");
    });
  });

  describe('#andWhere', function() {

    it('should combine condition with existing one using and operator', function() {
      expect(
        query.from('my-org')
          .select(['base', 'cpu'])
          .where(api.present(['label', 'prod']))
          .andWhere(api.present(['label', 'web']))
          .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu' FROM 'my-org' WHERE label:'prod' AND label:'web'");
    });
  });

  describe('#orWhere', function() {

    it('should combine condition with existing one using and operator', function() {
      expect(
        query.from('my-org')
          .select(['base', 'cpu'])
          .where(api.equals(['dl', 'source'], 'first-agent'))
          .orWhere(api.equals(['dl', 'source'], 'second-agent'))
          .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu' FROM 'my-org' WHERE dl:'source' = 'first-agent' OR dl:'source' = 'second-agent'");
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

    it('should allow nesting query parts as arguments', function() {
      var q = query.from('myorg');
      var partA = q
          .select(['base', 'cpu', 'system'])
          .apply('avg', ['30s'])
          .lastPart();
      var partB = q
          .select(['base', 'cpu', 'idle'])
          .apply('avg', ['30s'])
          .lastPart();

      expect(
        q.select(['base', 'cpu', 'user'])
          .apply('avg', ['30s'])
          .apply('sum', [partA, partB])
          .toString()
      ).to.be.equal(
        "SELECT sum(" +
          "avg('base'.'cpu'.'user' FROM 'myorg', 30s), " +
          "avg('base'.'cpu'.'system' FROM 'myorg', 30s), " +
          "avg('base'.'cpu'.'idle' FROM 'myorg', 30s))"
      );
    });

    it('should allow nesting query parts inside variables', function() {
      var q = query.from('myorg');
      var partA = q
          .select(['base', 'cpu', 'system'])
          .apply('avg', ['30s'])
          .lastPart();
      var partB = q
          .select(['base', 'cpu', 'idle'])
          .apply('avg', ['30s'])
          .lastPart();

      expect(
        q.select(['base', 'cpu', 'user'])
          .apply('avg', ['30s'])
          .apply('sum', ['$A', '$B'])
          .with('A', partA)
          .with('B', partB)
          .toString()
      ).to.be.equal(
        "SELECT sum(" +
          "avg('base'.'cpu'.'user' FROM 'myorg', 30s), " +
          "avg('base'.'cpu'.'system' FROM 'myorg', 30s), " +
          "avg('base'.'cpu'.'idle' FROM 'myorg', 30s))"
      );
    });
  });

  describe('#labelBy', function() {

    it('should label simple selectors with from statement', function() {
      expect(
        query.from('myorg')
        .select(['base', 'cpu', 'system'])
        .labelBy('$1')
        .toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'myorg' AS $1");
    });

    it('should label chained functions', function() {
      expect(
        query.from('myorg')
        .select(['base', 'network', 'eth0', 'sent'])
        .apply('derivate')
        .apply('sum', ['30s'])
        .labelBy('$1')
        .toString()
      ).to.be
        .equal("SELECT sum(derivate('base'.'network'.'eth0'.'sent' FROM 'myorg'), 30s) AS $1");
    });

    it('should only label selector for most recent collection', function() {
      expect(
        query.from('first-org')
        .select(['base', 'cpu', 'system'])
        .from('second-org')
        .select(['base', 'cpu', 'user'])
        .labelBy('$1')
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
        .equal("SELECT sum(derivate('base'.'network'.'eth0'.'sent' FROM 'myorg' SHIFT BY 1h), 30s)");
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

    it.skip('should concatenate query', function() {
      var q1 = query
          .from('first-org')
          .select(['base', 'cpu', 'system']);
      var q2 = query
          .from('second-org')
          .select(['base', 'cpu', 'user']);

      //var part = _.last(q1.parts);
      //part = part.andWhere().....;
      //
      //q3 = query.(part1, part2);
      //q3.last(1, 'day').exec();

      expect(
        q1.concat(q2).toString()
      ).to.be
        .equal("SELECT 'base'.'cpu'.'system' FROM 'first-org' SHIFT BY 1h, 'base'.'cpu'.'user' FROM 'second-org'");
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
