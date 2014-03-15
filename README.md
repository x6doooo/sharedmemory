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

### Example


```
    // express session

    // admin路径下的页面是后台页面，需要验证登录才能访问
    app.all('/admin/:route', function(req, res, next) {

        if (req.cookie.sessionKey) {

            // 如果cookie里有sessionKey，则用sessionKey取sessionValue，看是否处于登录状态
            sharedMemoryController.get(req.cookie.sessionKey, function(sessionValue) {
                if (sessionValue == 'hasLogin') {
                    // 已登录则进行下一步
                    next();
                } else {
                    // 未登录状态跳转到登录页
                    
                }
            });

        } else {

            // 没有sessionKey也跳转到登录页面
            req.redirect('/login');

        }

    });

    // 登录验证接口
    app.post('/api/checkLogin', function(req, res) {
        var user = req.query.user;
        var password = req.query.password

        // 首次登录用mysql验证
        connection.query('SELECT password FROM users WHERE user = "' + user + '"', function(err, rows) {

            if (rows.length && rows[0].password == password) {

                // 通过验证后，在客户端的cookie里记一个sessionKey，并在共享内存里记一个对应的sessionValue。
                // 下次访问先从session里做验证，效率比mysql高
                res.cookie('sessionKey', user);
                sharedMemoryController.set(user, 'hasLogin');

                //返回成功
                res.send('success');

            } else {

                //返回失败
                res.send('failed')
            }

        });
    });

```

