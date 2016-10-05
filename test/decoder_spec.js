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
        {n: "'0'",
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
           n: "'0'",
           r: 1000,
           v: [5, 6, 7, 8, 9, 10]
         },{
           n: "'0'",
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
                          n: "'0'",
                          r: 1000,
                          v: [5, 6, 7]
                        },{
                          n: "'0'",
                          r: 1000,
                          v: [8, 9, 10]
                        },{
                          n: "'1'",
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
              n: "'0'",
              r: 1000,
              v: [5, 6, 7]}]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu'])
                          .labelBy('Cpu usage'))
        .afterDecoding()
    ).to.have
      .deep.property('series[0].name', 'Cpu usage');
  });

  it('should fall-back to selector as label', function () {
    expect(
      data({s: 1472738400,
            d: [{
              n: "'0'",
              r: 1000,
              v: [5, 6, 7]}]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu']))
        .afterDecoding()
    ).to.have
      .deep.property('series[0].name', "'base'.'cpu' FROM 'my-org'");
  });

  it('should decode tags from annotated data', function () {
    expect(
      data({s: 1472738400,
            d: [{
              n: "'0'.'xxx-xxx'.'my-mac'",
              r: 1000,
              v: [5, 6, 7]}]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu'])
                          .annotateWith('dl:source', 'dl:hostname'))
        .afterDecoding()
    ).to.have
      .deep.property('series[0].tags')
      .that.is.deep.equal({'dl:source': 'xxx-xxx',
                           'dl:hostname': 'my-mac'});
  });

  it('should decode escaped characters in annotated data', function () {
    expect(
      data({s: 1472738400,
            d: [{
              n: "'0'.'Don\\'t mind quotes! (Even with second \\')'",
              r: 1000,
              v: [5, 6, 7]}]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu'])
                          .annotateWith('note'))
        .afterDecoding()
    ).to.have
      .deep.property('series[0].tags')
      .that.is.deep.equal({'note': "Don't mind quotes! (Even with second ')"});
  });

  it('should combine and apply confidence if such option was present', function () {
    expect(
      data(
        {s: 1472738400,
         d: [{
           n: "'0'.'v'",
           r: 1000,
           v: [5, 5, 7, 7, 9, 9]
         },{
           n: "'0'.'c'",
           r: 1000,
           v: [1, 0, 1, 0, 1, 0]
         }]})
        .commingFromQuery(new Query().from('my-org')
                          .select(['base', 'cpu']))
        .withOptions({applyConfidence: true})
        .afterDecoding()
    ).to.have
      .deep.property('series[0].points')
      .that.is.deep.equal([
        [5, 1472738400000],
        [7, 1472738402000],
        [9, 1472738404000]
      ]);
  });

  it('should match confidence based on meta-data when available', function () {
    var decoded =
          data(
            {s: 1472738400,
             d: [{
               n: "'0'.'v'.'mac-1'",
               r: 1000,
               v: [5, 6, 7, 8, 9, 10]
             },{
               n: "'0'.'c'.'mac-2'",
               r: 1000,
               v: [0, 1, 0, 1, 0, 1]
             },{
               n: "'0'.'c'.'mac-1'",
               r: 1000,
               v: [1, 0, 1, 0, 1, 0]
             },{
               n: "'0'.'v'.'mac-2'",
               r: 1000,
               v: [1, 2, 3, 4, 5, 6]
             }]})
          .commingFromQuery(new Query().from('my-org')
                            .select(['base', 'cpu'])
                            .annotateWith('host'))
          .withOptions({applyConfidence: true})
          .afterDecoding();
    
    expect(decoded).to.have
      .deep.property('series[0].points')
      .that.is.deep.equal([
        [5, 1472738400000],
        [7, 1472738402000],
        [9, 1472738404000]
      ]);

    expect(decoded).to.have
      .deep.property('series[1].points')
      .that.is.deep.equal([
        [2, 1472738401000],
        [4, 1472738403000],
        [6, 1472738405000]
      ]);
  });

  it('should match confidence based on ordering if meta-data is not available', function () {
    var decoded =
          data(
            {s: 1472738400,
             d: [{
               n: "'0'.'v'",
               r: 1000,
               v: [5, 6, 7, 8, 9, 10]
             },{
               n: "'0'.'c'",
               r: 1000,
               v: [0, 1, 0, 1, 0, 1]
             },{
               n: "'0'.'c'",
               r: 1000,
               v: [1, 0, 1, 0, 1, 0]
             },{
               n: "'0'.'v'",
               r: 1000,
               v: [1, 2, 3, 4, 5, 6]
             }]})
          .commingFromQuery(new Query().from('my-org')
                            .select(['base', 'cpu'])
                            .annotateWith('host'))
          .withOptions({applyConfidence: true})
          .afterDecoding();
    
    expect(decoded).to.have
      .deep.property('series[0].points')
      .that.is.deep.equal([
        [6, 1472738401000],
        [8, 1472738403000],
        [10, 1472738405000]
      ]);

    expect(decoded).to.have
      .deep.property('series[1].points')
      .that.is.deep.equal([
        [1, 1472738400000],
        [3, 1472738402000],
        [5, 1472738404000]
      ]);
  });

  it('should match confidence and leave interpolated points if data is to be aligned', function () {
    var decoded =
          data(
            {s: 1472738400,
             d: [{
               n: "'0'.'v'.'mac-1'",
               r: 1000,
               v: [5, 6, 7, 8, 9]
             },{
               n: "'0'.'c'.'mac-1'",
               r: 1000,
               v: [0, 1, 0, 1, 0]
             },{
               n: "'0'.'v'.'mac-2'",
               r: 1000,
               v: [1, 2, 3, 4, 5]
             },{
               n: "'0'.'c'.'mac-2'",
               r: 1000,
               v: [0, 0, 1, 0, 0]
             }]})
          .commingFromQuery(new Query().from('my-org')
                            .select(['base', 'cpu'])
                            .annotateWith('host'))
          .withOptions({applyConfidence: 'aligned'})
          .afterDecoding();

    expect(decoded).to.have
      .deep.property('series[0].points')
      .that.is.deep.equal([
        [6, 1472738401000],
        [7, 1472738402000],
        [8, 1472738403000]
      ]);
  });

});
