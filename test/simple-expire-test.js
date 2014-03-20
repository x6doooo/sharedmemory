var initSharedMemory = require('../sharedmemory').init;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var cfg = {
  cache: {
    type: 'expire',
    time: 20000
    //type: 'LRU',
    //max: 10000
  }
};

var sharedMemoryController = initSharedMemory(cfg);

var watch = function(name, func, count) {

  var i;
  var startTime = Date.now();

  for (i = 0; i < count; i++) {
    func(i);
  }

  var endTime = Date.now();

  var time = endTime - startTime;

  var avgTime = (count / time * 1000).toFixed(2);

  console.log(name + ' => 耗时: ' + time + ' ms | ' + avgTime + ' o/s');
};

if (cluster.isMaster) {

  // transfer
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

} else {

  var max = 100 * 1000;

  watch('set', function(i) {
    sharedMemoryController.set(cluster.worker.id + '-' + i, i);
  },
  max);

  for (var i = 0; i < max; i++) {
    sharedMemoryController.set(i, i);
  }

  watch('get', function(i) {
    sharedMemoryController.get(i);
  },
  max);

}

