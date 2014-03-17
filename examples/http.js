var initSharedMemory = require('../sharedmemory').init;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var express = require('express');
var mysql = require('mysql');

var sharedMemoryController = initSharedMemory();

if (cluster.isMaster) {

  for(var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });

} else {

  var app = express();

  var connection = mysql.createConnection({
  
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test' 
  
  });

  app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(app.router);
    app.use(express.logger());

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

	app.all('/admin/:route', function(req, res, next) {

		if (req.cookies.sessionKey) {
			sharedMemoryController.get(req.cookies.sessionKey, function(sessionValue) {
        console.log(req.cookies.sessionKey);
				if (sessionValue) {
					next();
        } else {
          res.redirect('/login');
        }
			});
    } else {
      res.redirect('/login');
    }

	});

  app.all('/admin/:route', function(req, res) {
    res.send('has login')
  });

	app.get('/login', function(req, res) {
    res.render('login');
	});

  app.post('/api/checkLogin', function(req, res) {
    var user = req.body.user;
    var password = req.body.password;
    connection.query('SELECT password FROM users WHERE user = "' + user + '"', function(err, rows) {
      if (rows.length && rows[0].password == password) {
        sharedMemoryController.set(user, 'true');
        res.cookie('sessionKey', user);
        res.send('ok');
        return;
      }
      res.send('failed')
    });	
    
  });

	app.listen('3000');

}



