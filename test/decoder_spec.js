/*global describe, it, beforeEach*/

import chai from 'chai';
import sinon from 'sinon';
import source_map from 'source-map-support';
import Decoder from "./decoder";

source_map.install({handleUncaughtExceptions: false});


describe('Decoder', function() {
  var expect = chai.expect;

  it.skip('should return points array for each series');
  it.skip('should match returned series with selectors');
  it.skip('should decode label from alias');
  it.skip('should decode tags from annotated data');

  it.skip('should combine and apply confidence if such option was present');
});
