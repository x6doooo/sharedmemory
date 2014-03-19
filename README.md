SharedMemory
===
通过IPC实现Cluster共享内存

[![NPM](https://nodei.co/npm/sharedmemory.png)](https://nodei.co/npm/sharedmemory/)

### Installation
	npm install sharedmemory

### Usage

```javascript
var cluster = require('cluster')
var initSharedMemory = require('./sharedmemory').init;

// 创建共享内存的控制器
// 在master进程中，控制器负责维护共享内存
// 在worker进程中，控制器负责和master的控制器通信，通过IPC消息对共享内存进行读写操作
var sharedMemoryController = initSharedMemory();

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

### Configure

1、 无参数

```javascript
require('./sharedmemory').init();
```

默认情况会直接在主进程里创建共享内存，并且没有缓存控制策略

2、 过期淘汰

```javascript
require('./sharedmemory').init({
    cache: {
        type: 'expire', //类型
        expire: 60 * 60 * 1000    //一小时过期。不指定则采用默认的30分钟过期
    }
});
```

3、 LRU

```javascript
require('./sharedmemory').init({
    cache: {
        type: 'LRU', //类型
        max: 20000    //最多20000条记录。不指定则采用默认的10000条
    }
});
```

超过记录数，最长时间未被访问的记录会被删除。

