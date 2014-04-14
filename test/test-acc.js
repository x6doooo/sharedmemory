var initSharedMemory = require('../lib/sharedmemory').init;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var http = require('http');
var sharedMemoryController = initSharedMemory();




if (cluster.isMaster) {

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    setInterval(function(){
        console.log('共享内存中count值：' + sharedMemoryController.__sharedMemory__.get('count'));
    }, 10 * 1000);


} else {

    var worker_count = 0;

    http.createServer(function(req,res){

        worker_count += 1;
                
        sharedMemoryController.plusOne('count');

        res.end();

    }).listen(1337);

    setInterval(function(){
        console.log('worker-' + cluster.worker.id + '响应请求次数：' +  worker_count);
    }, 10 * 1000);

}

