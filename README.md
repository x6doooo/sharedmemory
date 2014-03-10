# SharedMemory
通过IPC实现Cluster共享内存

[![NPM](https://nodei.co/npm/sharedmemory.png)](https://nodei.co/npm/sharedmemory/)

## Super simple to use

```javascript
var cluster = require('cluster')
var initSharedMemory = require('./sharedmemory').init;

// 创建共享内存的控制器
// 在master进程中，控制器负责维护共享内存
// 在worker进程中，控制器负责和master的控制器通信，实现读写功能
var sharedMemoryController = initSharedMemory();
//node --trace_gc --trace_gc_verbose --expose-gc test.js
if (cluster.isMaster) {

    // fork第一个worker
    cluster.fork();

    // 1秒后fork第二个worker
    setTimeout(function() {
        cluster.fork(); 
    }, 1000);
      
} else {

    if (cluster.worker.id == 1) {
        // 第一个worker向共享内存写入一组数据，用a标记
        sharedMemoryController.set('a', [0, 1, 2, 3]);
    }

    if (cluster.worker.id == 2) {
        // 第二个worker从共享内存读取a的值
        sharedMemoryController.get('a', function(data) {
            console.log(data);  // => [0, 1, 2, 3]
        });
    }
    
}
```

