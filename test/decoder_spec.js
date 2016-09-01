/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import moment from 'moment';
import Decoder from "./decoder";

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
        {s: 1472738400,
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
           r: 1000,
           v: [5, 6, 7, 8, 9, 10]
         },{
           r: 2000,
           v: [8, 10, 12]
         }]})
        .afterDecoding()
    ).to.have
      .deep.property('series[1].points')
      .that.is.deep.equal([
        [8, 1472738400000],
        [10, 1472738402000],
        [12, 1472738404000]
      ]);
  });

  it.skip('should match returned series with selectors');
  it.skip('should decode label from alias');
  it.skip('should decode tags from annotated data');
  it.skip('should combine and apply confidence if such option was present');
});
