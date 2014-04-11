var initSharedMemory = require('../../sharedmemory').init;
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

//var sharedMemoryController = initSharedMemory(cfg);
var sharedMemoryController = initSharedMemory();

var watch = function(name, func, count) {

    var i;
    var startTime = Date.now();

    for (i = 0; i < count; i++) {
        func(i);
    }

    var endTime = Date.now();

    var time = endTime - startTime;

    var avgTime = (count / time * 1000).toFixed(2);

    console.log(name + ' => ' + count + ' 次 | 总耗时 ' + time + ' ms | 平均 ' + avgTime + ' o/s');

};

if (cluster.isMaster) {

    // transfer
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

} else {

    var max = 100 * 1000;

    var key, value;
    watch('set', function(i) {
        key = value = cluster.worker.id + '-' + i;
        sharedMemoryController.set(key, value);
    },
    max);

/*
    for (var i = 0; i < max; i++) {
        sharedMemoryController.set(cluster.worker.id + '-' + i, cluster.worker.id + '-' + i);
    }
*/  

    var err_count = 0;
    var result_count = 0;
    watch('get', function(i) {
        var key = cluster.worker.id + '-' + i;
        sharedMemoryController.get(key, function(data){
            if(key != data){
                console.log(key, data);
                err_count += 1;
            }
            result_count += 1;
            if (result_count == max) {
                console.log("get正确率 = " + (result_count - err_count) / result_count * 100 + '%' );
            }
        });
    },
    max);
}

