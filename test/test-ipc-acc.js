/**
 *
 *  IPC通信并发测试
 *
 * */

var initSharedMemory = require('../lib/sharedmemory').init;
var Manager = require('../lib/sharedmemory').Manager;
var User = require('../lib/sharedmemory').User;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var http = require('http');
var sharedMemoryController = initSharedMemory();
var fs = require('fs');

// 扩展Manager类和User类，增加日志记录
var master_records = [];
Manager.prototype.handle = function(data, target) {
    var self = this;
    var value = this[data.method](data);

    // 记录主进程接收到的通信日志
    master_records.push('master-receive: ' + data.id + '-' + data.uuid + 
        ' (' + (data.value.length > 1000 ? data.value.length / 1024 + ' KiB' : data.value.length + ' bytes') + ')');
    
    var msg = {
        isSharedMemoryMessage: true,
        id: data.id,
        uuid: data.uuid,
        value: value
    };

    target.send(msg);

};

var user_records = [];
User.prototype.handle = function(method, key, value, cb) {

    var self = this;
    var uuid = self.uuid();

    user_records.push('worker-send: ' + cluster.worker.id + '-' + uuid + 
        ' (' + (value.length > 1000 ? value.length / 1024 + ' KiB' : value.length + ' bytes') + ')');
    
    process.send({
        isSharedMemoryMessage: true,
        method: method,
        id: cluster.worker.id,
        uuid: uuid,
        key: key,
        value: value
    });

    self.__getCallbacks__[uuid] = cb;

};

// x为两个通信数据，x[0]为100k, x[1]为三个字符
var x = ['', ''];

for(var i = 0; i < 100 * 1024; i++) {
    x[0] += 'x';
}

x[1] = 'abc';


if (cluster.isMaster) {
    
    var worker;

    for (var i = 0; i < numCPUs; i++) {
        worker = cluster.fork();

        var updateCount = 0;

        worker.on('message', function(data) {
            // 打印
            if (data == 'showResult') {

                updateCount = 0;

                var fileName = './master.log';
                
                var exist = fs.existsSync(fileName)

                if (exist) {
                    fs.writeFileSync(fileName, '');
                }

                master_records.forEach(function(v) {
                    fs.appendFileSync(fileName, v + '\n');
                });

                console.log(fileName, 'update done!');
                
                eachWorker(function(worker) {
                    console.log(worker.id, '.log start update...');
                    worker.send('showResult');
                });   
            }
            
            if (data == 'logUpdateDone') {
                updateCount += 1;
                if (updateCount == numCPUs) {
                    analysis();
                }
            }

        });
    }

    function eachWorker(callback) {
        for (var id in cluster.workers) {
            callback(cluster.workers[id]);
        }
    } 

} else {

    var worker_count = 0;

    http.createServer(function(req,res){

        worker_count += 1;
        
        if (req.url == '/result') {
            process.send('showResult');
        } else {
            // x[0]和x[1]交替发送，测试异步IPC的IO是否有序
            sharedMemoryController.set('x', x[worker_count % 2]);
        }

        res.end();

    }).listen(1337);

    process.on('message', function(data) {

        if (data == 'showResult') {
            
            var fileName = './' + cluster.worker.id + '.log';
        
            var exist = fs.existsSync(fileName)

            if (exist) {
                fs.writeFileSync(fileName, '');
            }

            user_records.forEach(function(v) {
                fs.appendFileSync(fileName, v + '\n');
            });

            console.log(fileName, 'update done!');

            process.send('logUpdateDone');
        
        }

    });

}

function analysis() {
    analysis_master_logs();
}

function analysis_master_logs() {
    var master_logs = fs.readFileSync('./master.log', 'utf8');
    var logs = {};
    master_logs = master_logs.split('\n');
    master_logs.forEach(function(v) {
        if (v == '') return;
        var tem = v.replace('master-receive: ', '').split('-')[0];
        if (!logs[tem]) {
            logs[tem] = [];
        }
        logs[tem].push(v);
    });
    console.log(logs);
    console.log('analysis done');
    eachWorker(function(worker) {
        worker.kill(0);
    });
    process.exit(0);
}



