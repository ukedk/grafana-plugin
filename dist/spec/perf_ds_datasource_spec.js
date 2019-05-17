"use strict";

System.register(["../datasources/perf-ds/module", "q"], function (_export, _context) {
  "use strict";

  var Datasource, Q, _slicedToArray;

  return {
    setters: [function (_datasourcesPerfDsModule) {
      Datasource = _datasourcesPerfDsModule.Datasource;
    }, function (_q) {
      Q = _q.default;
    }],
    execute: function () {
      _slicedToArray = function () {
        function sliceIterator(arr, i) {
          var _arr = [];
          var _n = true;
          var _d = false;
          var _e = undefined;

          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);

              if (i && _arr.length === i) break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"]) _i["return"]();
            } finally {
              if (_d) throw _e;
            }
          }

          return _arr;
        }

        return function (arr, i) {
          if (Array.isArray(arr)) {
            return arr;
          } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
          } else {
            throw new TypeError("Invalid attempt to destructure non-iterable instance");
          }
        };
      }();

      describe('OpenNMSPMDatasource', function () {
        var ctx = {};

        beforeEach(function () {
          ctx.$q = Q;
          ctx.backendSrv = {};
          ctx.templateSrv = { replace: function replace(val) {
              return val;
            }, containsVariable: function containsVariable() {
              return true;
            } };
          ctx.ds = new Datasource({ url: '' }, ctx.$q, ctx.backendSrv, ctx.templateSrv);
        });

        describe('querying with one target', function () {
          var query = {
            range: { from: 'now-1h', to: 'now' },
            targets: [{
              type: "attribute",
              nodeId: '1',
              resourceId: 'nodeSnmp[]',
              attribute: 'loadavg1',
              aggregation: 'AVERAGE'
            }],
            interval: '1s'
          };

          var response = {
            "step": 300000,
            "start": 1424211730000,
            "end": 1424226130000,
            "timestamps": [1424211730001],
            "labels": ["loadavg1"],
            "columns": [{
              "values": [5.0]
            }]
          };

          it('should return a list of series', function (done) {
            ctx.backendSrv.datasourceRequest = function (request) {
              return ctx.$q.when({
                _request: request,
                status: 200,
                data: response
              });
            };

            ctx.ds.query(query).then(function (result) {
              expect(result.data).to.have.length(1);
              expect(result.data[0].target).to.equal('loadavg1');
              expect(result.data[0].datapoints).to.have.length(1);
              done();
            });
          });
        });

        describe('relaxed mode', function () {
          var query = {
            range: { from: 'now-1h', to: 'now' },
            targets: [{
              type: "attribute",
              nodeId: '1',
              resourceId: 'nodeSnmp[]',
              attribute: 'does-not-exist',
              aggregation: 'AVERAGE'
            }],
            interval: '1s'
          };

          var response = {
            "step": 300000,
            "start": 1424211730000,
            "end": 1424226130000,
            "timestamps": [1424211730001],
            "labels": ["loadavg1"],
            "columns": [{
              "values": [NaN]
            }]
          };

          it('should filter series that contain only NaNs', function (done) {
            ctx.backendSrv.datasourceRequest = function (request) {
              return ctx.$q.when({
                _request: request,
                status: 200,
                data: response
              });
            };

            ctx.ds.query(query).then(function (result) {
              expect(result.data).to.have.length(0);
              done();
            });
          });
        });

        describe('testing for connectivity', function () {
          it('should make a request to /rest/info', function (done) {
            ctx.backendSrv.datasourceRequest = function (request) {
              expect(request.url).to.equal('/rest/info');
              return ctx.$q.when({
                status: 200
              });
            };

            ctx.ds.testDatasource().then(function () {
              done();
            });
          });
        });

        describe('using templates', function () {
          it('should perform simple variable substitution', function () {
            ctx.templateSrv.variables = [{ name: 'variable', current: { value: 'loadavg1' } }];

            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: '$variable',
                aggregation: 'AVERAGE'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery2 = _slicedToArray(_ctx$ds$buildQuery, 1),
                query = _ctx$ds$buildQuery2[0];

            expect(query.source.length).to.equal(1);
            expect(query.source[0].attribute).to.equal("loadavg1");
          });

          it('should support scoped variables', function () {
            ctx.templateSrv.variables = [{ name: 'variable', current: { value: 'loadavg1' } }];

            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: '$variable',
                aggregation: 'AVERAGE'
              }],
              interval: '1s',
              scopedVars: {
                'variable': {
                  value: 'loadavg5'
                }
              }
            };

            var _ctx$ds$buildQuery3 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery4 = _slicedToArray(_ctx$ds$buildQuery3, 1),
                query = _ctx$ds$buildQuery4[0];

            expect(query.source.length).to.equal(1);
            expect(query.source[0].attribute).to.equal("loadavg5");
          });

          it('should use node[] or nodeSource[] based on the contents of the variable', function () {
            ctx.templateSrv.variables = [{ name: 'node', current: { value: ['1', 'FS:FID'] } }];

            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '$node',
                resourceId: 'nodeSnmp[]',
                attribute: 'CpuRawIdle',
                aggregation: 'AVERAGE',
                label: 'idle on $node'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery5 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery6 = _slicedToArray(_ctx$ds$buildQuery5, 1),
                query = _ctx$ds$buildQuery6[0];

            expect(query.source.length).to.equal(2);
            expect(query.source[0].resourceId).to.equal("node[1].nodeSnmp[]");
            expect(query.source[1].resourceId).to.equal("nodeSource[FS:FID].nodeSnmp[]");
          });

          it('should generate multiple sources for multi-valued template variables', function () {
            ctx.templateSrv.variables = [{ name: 'v1', current: { value: ['1', '2'] } }, { name: 'v2', current: { value: ['x', 'y'] } }];

            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: '$v1-$v2',
                aggregation: 'AVERAGE'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery7 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery8 = _slicedToArray(_ctx$ds$buildQuery7, 1),
                query = _ctx$ds$buildQuery8[0];

            expect(query.source.length).to.equal(4);
            expect(query.source[0].attribute).to.equal("1-x");
            expect(query.source[1].attribute).to.equal("1-y");
            expect(query.source[2].attribute).to.equal("2-x");
            expect(query.source[3].attribute).to.equal("2-y");
          });

          it('should handle substituting "All" with all of the available values', function () {
            ctx.templateSrv.variables = [{
              name: 'x',
              current: { value: ['$__all'] },
              options: [{ value: '$__all' }, { value: 'a' }, { value: 'b' }, { value: 'c' }, { value: 'd' }]
            }];

            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: '$x',
                aggregation: 'AVERAGE'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery9 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery10 = _slicedToArray(_ctx$ds$buildQuery9, 1),
                query = _ctx$ds$buildQuery10[0];

            expect(query.source.length).to.equal(4);
            expect(query.source[0].attribute).to.equal("a");
            expect(query.source[1].attribute).to.equal("b");
            expect(query.source[2].attribute).to.equal("c");
            expect(query.source[3].attribute).to.equal("d");
          });

          it('should perform variable substitution on all filter parameters', function () {
            ctx.templateSrv.variables = [{ name: 'variable', current: { value: ['x', 'y'] } }];

            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: '$variable',
                aggregation: 'AVERAGE'
              }, {
                type: "filter",
                filter: {
                  name: "some-filter"
                },
                filterParameters: {
                  param1: 1,
                  param2: '$variable'
                }
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery11 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery12 = _slicedToArray(_ctx$ds$buildQuery11, 1),
                query = _ctx$ds$buildQuery12[0];

            expect(query.filter.length).to.equal(2);
            expect(query.filter[0].name).to.equal("some-filter");
            expect(query.filter[0].parameter.length).to.equal(2);
            expect(query.filter[0].parameter[0].key).to.equal("param1");
            expect(query.filter[0].parameter[0].value).to.equal(1);
            expect(query.filter[0].parameter[1].key).to.equal("param2");
            expect(query.filter[0].parameter[1].value).to.equal("x");

            expect(query.filter[1].name).to.equal("some-filter");
            expect(query.filter[1].parameter.length).to.equal(2);
            expect(query.filter[1].parameter[0].key).to.equal("param1");
            expect(query.filter[1].parameter[0].value).to.equal(1);
            expect(query.filter[1].parameter[1].key).to.equal("param2");
            expect(query.filter[1].parameter[1].value).to.equal("y");
          });
        });

        describe('preserving order', function () {
          it('should preserve a single label', function () {
            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'loadavg1',
                aggregation: 'AVERAGE'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery13 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery14 = _slicedToArray(_ctx$ds$buildQuery13, 2),
                labels = _ctx$ds$buildQuery14[1];

            expect(labels.length).to.equal(1);
            expect(labels[0]).to.equal("loadavg1");
          });

          it('should preserve multiple labels', function () {
            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'loadavg1',
                aggregation: 'AVERAGE'
              }, {
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'loadavg5',
                aggregation: 'AVERAGE'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery15 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery16 = _slicedToArray(_ctx$ds$buildQuery15, 2),
                labels = _ctx$ds$buildQuery16[1];

            expect(labels.length).to.equal(2);
            expect(labels[0]).to.equal("loadavg1");
            expect(labels[1]).to.equal("loadavg5");
          });

          it('should preserve multiple labels (reverse)', function () {
            var options = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'loadavg5',
                aggregation: 'AVERAGE'
              }, {
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'loadavg1',
                aggregation: 'AVERAGE'
              }],
              interval: '1s'
            };

            var _ctx$ds$buildQuery17 = ctx.ds.buildQuery(options),
                _ctx$ds$buildQuery18 = _slicedToArray(_ctx$ds$buildQuery17, 2),
                labels = _ctx$ds$buildQuery18[1];

            expect(labels.length).to.equal(2);
            expect(labels[0]).to.equal("loadavg5");
            expect(labels[1]).to.equal("loadavg1");
          });

          it('should reorder the series', async function () {
            var query = {
              range: { from: 'now-1h', to: 'now' },
              targets: [{
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'a',
                aggregation: 'AVERAGE'
              }, {
                label: "b",
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'woot',
                aggregation: 'AVERAGE'
              }, {
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: 'missing',
                aggregation: 'AVERAGE'
              }, {
                type: "attribute",
                nodeId: '1',
                resourceId: 'nodeSnmp[]',
                attribute: '$variable',
                aggregation: 'AVERAGE'
              }],
              scopedVars: {
                'variable': {
                  value: 'c'
                }
              },
              interval: '1s'
            };

            var response = {
              "step": 5,
              "start": 0,
              "end": 10,
              "timestamps": [0, 5, 10],
              'labels': ['a', 'c', 'b'],
              "columns": [{ 'values': [1, 2, 3] }, { 'values': [9, 9, 9] }, { 'values': [3, 2, 1] }]
            };

            ctx.templateSrv.variables = [{ name: 'variable', current: { value: 'x' } }, { name: 'nodeId', current: { value: '1' } }];
            ctx.backendSrv.datasourceRequest = function (request) {
              return ctx.$q.when({
                _request: request,
                status: 200,
                data: response
              });
            };

            var result = await ctx.ds.query(query);
            expect(result.data.length).to.equal(3);
            expect(result.data[0].target).to.equal('a');
            expect(result.data[0].datapoints).to.deep.equal([[1, 0], [2, 5], [3, 10]]);
            expect(result.data[1].target).to.equal('b');
            expect(result.data[1].datapoints).to.deep.equal([[3, 0], [2, 5], [1, 10]]);
            expect(result.data[2].target).to.equal('c');
            expect(result.data[2].datapoints).to.deep.equal([[9, 0], [9, 5], [9, 10]]);
          });
        });
      });
    }
  };
});
//# sourceMappingURL=perf_ds_datasource_spec.js.map