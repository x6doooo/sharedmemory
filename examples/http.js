var initSharedMemory = require('../sharedmemory').init;

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var express = require('express');

// 初始化共享内存控制器
var sharedMemoryController = initSharedMemory({

  // 使用LRU淘汰缓存，最大缓存20k条记录
  cache: {
    type: 'LRU',
    max: 20 * 1000
  }

});

if (cluster.isMaster) {

  // 根据CPU数fork子进程
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 监听子进程退出，触发重新fork
  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });

} else {

  // 子进程开启服务
  var app = express();

  // 服务配置
  app.configure(function() {

    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(app.router);

    //模板
    app.set('view engine', 'ejs');
    app.engine('.html', require('ejs').__express);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/view');
    app.use('/public', express.static(__dirname + '/public'));
    app.set('view options', {
      layout: false
    });

  });

  // 如果访问/admin路径下的页面，需要先验证权限
  app.all('/admin/:route', function(req, res, next) {

    // cookie里有sessionKey
    if (req.cookies.sessionKey) {

      // 根据sessionKey，从共享内存中取sessionValue
      sharedMemoryController.get(req.cookies.sessionKey, function(sessionValue) {

        if (sessionValue) {

          // sessionValue为真，表明具有权限，继续正常访问
          next();

        } else {

          // sessionValue不为真，表明不具权限或权限过期，跳转到登录页
          res.redirect('/login');

        }

      });

    } else {

      // cookie里没有sessionKey直接跳转到登录页
      res.redirect('/login');

    }

  });

  // 验证权限后，正常访问/admin路径下的页面
  app.all('/admin/:route', function(req, res) {
    res.send('has login')
  });

  // 登录页
  app.get('/login', function(req, res) {
    res.render('login');
  });

  // 登录验证接口
  app.post('/api/checkLogin', function(req, res) {

    var user = req.body.user;
    var password = req.body.password;

    // 验证（首次验证一般需要从数据库获取信息，此处示例做简化）
    var users = {
      "test": "3b50a543d5cc7a29e7d5a4db495622ee"
    }

    if (users[user] == password) {
      // 登录成功，在共享内存里写入sessionValue，键名作为sessionKey写入到cookie里
      sharedMemoryController.set(user, 'true');
      res.cookie('sessionKey', user);
      res.send('ok');
      return;
    }
    res.send('failed');

  });

  app.listen('3000');

}

