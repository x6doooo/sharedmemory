var initSharedMemory = require('../sharedmemory').init;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var express = require('express');

var sharedMemoryController = initSharedMemory();


if (cluster.isMaster) {

  for(var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

} else {

  var app = express();

  app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.logger());

    //模板
    app.set('view engine', 'ejs');
    app.engine('.html', require('ejs').__express);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    app.set('view options', {
      layout: false
    });

    //静态文件
    app.use('/public', express.static(__dirname + '/public'));
  });

}



//TODO
/*
var express = require('express');

var mysql = require('mysql');

var cfg = {
	cache: {
		type: 'expire',
		time: 20000
	}
};

var sharedMemoryController = initSharedMemory(cfg);

if (cluster.isMaster) {

	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

} else {

	var app = express();

	app.all('/admin/:route', function(req, res, next) {
		if (req.cookie.sessionKey) {
			sharedMemoryController.get(req.cookie.sessionKey, function(sessionValue) {
				if (sessionValue) {
					next();
				} else {
					req.redirect('/login');
				}
			});
		}
	});

	app.post('/login', function(req, res) {

	});

	app.listen('3000');


	
		  connection.query('SELECT password FROM users WHERE user = "' + user + '"', function(err, rows) {
				rows.length && rows[0].password == password && next();
      });	
        */

}

