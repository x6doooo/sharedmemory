var initSharedMemory = require('../sharedmemory').init;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var http = require('http');

var cfg = {
    cache: {
        type: 'expire',
        time: 20000
    }
};

var count = 0;

//var sharedMemoryController = initSharedMemory(cfg);
var sharedMemoryController = initSharedMemory(cfg);

if (cluster.isMaster) {

    // transfer
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

} else {

    http.createServer(function (req, res) {
        var id = cluster.worker.id + '-' + count++;
        sharedMemoryController.set(id, count, function(){
            sharedMemoryController.get(id, function(v){
                console.log(v);
            });
        });
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    }).listen(1337, '127.0.0.1');
    
    console.log('Server running at http://127.0.0.1:1337/');

}