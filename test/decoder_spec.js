/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import moment from 'moment';
import Decoder from './decoder';
import Query from './query';

source_map.install({handleUncaughtExceptions: false});


chai.Assertion.addMethod('sameMoment', function(expected) {
  var objMoment = moment(this._obj),
      expectedMoment = moment(expected);

  function f (m) {
    return m.format('lll');
  }

  this.assert(
    objMoment.isSame(expectedMoment),
    `expected ${f(objMoment)} to be the same as ${f(expectedMoment)}`,
    `expected ${f(objMoment)} not to be the same as ${f(expectedMoment)}`
  );
});


describe('Decoder', function () {
  var expect = chai.expect;

  function data(d) {
    var query = null,
        options = {};

    return {
      commingFromQuery: function (q) {
        query = q;
        return this;
      },
      withOptions: function (o) {
        options = o;
        return this;
      },
      afterDecoding: function () {
        var decoder = new Decoder(query, options);
        return decoder.decode(d);
      }
    };
  }

  it('should decode start time', function() {
    expect(
      data(
        {n: '0',
         s: 1472738400,
         d: []})
        .afterDecoding()
    ).to.have
      .property('start')
      .that.is.sameMoment('2016-09-01T14:00:00Z');
  });

  it('should return points array for each series', function () {
    expect(
      data(
        {s: 1472738400,
         d: [{
           n: '0',
           r: 1000,
           v: [5, 6, 7, 8, 9, 10]
         },{
           n: '0',
           r: 2000,
           v: [8, 10, 12]
         }]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu']))
        .afterDecoding()
    ).to.have
      .deep.property('series[1].points')
      .that.is.deep.equal([
        [8, 1472738400000],
        [10, 1472738402000],
        [12, 1472738404000]
      ]);
  });

  it('should match returned series with selectors', function () {
    var query = new Query()
          .from('my-org')
          .select(['base', 'cpu'])
          .select(['base', 'load_5min']),
        decoded = data({s: 1472738400,
                        d: [{
                          n: '0',
                          r: 1000,
                          v: [5, 6, 7]
                        },{
                          n: '0',
                          r: 1000,
                          v: [8, 9, 10]
                        },{
                          n: '1',
                          r: 1000,
                          v: [0.1, 0.2, 0.3]
                        }]})
          .commingFromQuery(query)
          .afterDecoding();
    
    expect(decoded).to.have.deep.property('series[0].qpart', query.parts[0]);
    expect(decoded).to.have.deep.property('series[1].qpart', query.parts[0]);
    expect(decoded).to.have.deep.property('series[2].qpart', query.parts[1]);
  });

  it('should match label from queried part', function() {
    expect(
      data({s: 1472738400,
            d: [{
              n: '0',
              r: 1000,
              v: [5, 6, 7]}]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu'])
                          .labelBy('Cpu usage'))
        .afterDecoding()
    ).to.have
      .deep.property('series[0].name', 'Cpu usage');
  });

  it('Shoudl fall-back to selector as label', function () {
    expect(
      data({s: 1472738400,
            d: [{
              n: '0',
              r: 1000,
              v: [5, 6, 7]}]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu']))
        .afterDecoding()
    ).to.have
      .deep.property('series[0].name', "'base'.'cpu' FROM 'my-org'");
  });
  
  // n of a series is like: '0'.'c3bcee12-0680-4bf3-8237-f51b48330dd8'.'toms-mac'
  it.skip('should decode tags from annotated data');
  it.skip('Should decode escaped characters in annotated data');
  it.skip('should combine and apply confidence if such option was present');
});
