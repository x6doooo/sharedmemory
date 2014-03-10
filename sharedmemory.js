/**
* @project SharedMemory
* @author Dx.Yang <x6doooo@gmail.com>
* @version 0.0.3
* @license See LICENSE-MIT file included in this distribution.
*/

/**
* Module dependencies.
*/
var cluster = require('cluster');

var errDesc = {
    '1': '[ERROR] sharedMemory.init(config) => config.manager is wrong type!'
};

/**
* @class Manager
* @classdesc 直接控制共享内存的类
* @constructor
* @return A new instance of Manager
*/
var Manager = function() {

    var self = this;
    
    // 初始化共享内存
    self.__sharedMemory__ = {};

    if(cluster.isMaster) {
        
        // manager是clusterMaster时，监听并处理来自worker的请求
        cluster.on('online', function(worker) {
            worker.on('message', function(data) {
                if (!data.isSharedMemoryMessage) return;
                self.handle(data);
                return false;
            });
        });
    
    }else{
    
        // manager是clusterWorker时，监听并处理来自clusterMaster转发的请求
        process.on('message', function(data) {
            if (!data.isSharedMemoryMessage) return;
            self.handle(data);
        });

    }
};

/**
* @method handle
* @private
* @instance
* @memberOf Manager
* @param {object} data
*/
Manager.prototype.handle = function(data) {
    var self = this;
    var value = this[data.method](data);

    var msg = {
        isSharedMemoryMessage: true,
        id: data.id,
        uuid: data.uuid,
        value: value
    };

    if(cluster.isMaster) {
        cluster.workers[data.id].send(msg);
        return;
    }

    process.send(msg);

};

/**
* @method set
* @private
* @instance
* @memberOf Manager
* @param {object} data
* @returns {string} 'OK'
*/
Manager.prototype.set = function(data) {
    this.__sharedMemory__[data.key] = data.value;
    return 'OK';
};

/**
* @method get
* @private
* @instance
* @memberOf Manager
* @param {object} data
* @returns {*}
*/
Manager.prototype.get = function(data) {
    return this.__sharedMemory__[data.key];
};

/**
* @class User
* @classdesc 通过IPC读写共享内存的类
* @constructor
* @returns A new instance of User
*/
var User = function() {

    var self = this;
    self.__uuid__ = 0;

    /** 
    * 缓存读写操作的回调函数
    * @member {Object} __getCallbacks__
    * @private
    * @instance
    * @memberOf User
    */
    self.__getCallbacks__ = {};

    // 监听读写之后的回信
    process.on('message', function(data) {

        // sharememory的通信标记
        if (!data.isSharedMemoryMessage) return;
        var cb = self.__getCallbacks__[data.uuid];
        if (cb && typeof cb == 'function') {
            cb(data.value)
        }
        self.__getCallbacks__[data.uuid] = undefined;

    });

};

/**
* 获取每次通信的uuid
* @method uuid
* @private
* @instance
* @memberOf User
* @returns {number}
*/
User.prototype.uuid = function() {
    var i = this.__uuid__;
    return this.__uuid__ = i = i > 65535 ? 0 : i + 1;
};

/**
* 写入数据
* @method set
* @instance
* @memberOf User
* @param {string} key - 键
* @param {*} value - 值（不建议使用function类型）
* @param {User~setCallback} cb - 回调函数
*/
/**
* @callback User~setCallback
* @param {string} data - 'OK'表示成功
*/
User.prototype.set = function(key, value, cb) {
    this.handle('set', key, value, cb);
};

/**
* 读取数据
* @method get
* @instance
* @memberOf User
* @param {string} key - 键
* @param {User~getCallback} cb - 回调函数
*/
/**
* @callback User~getCallback
* @param {*} data - key对应的数据
*/
User.prototype.get = function(key, cb) {
    this.handle('get', key, null, cb);
};

/**
* 删除数据
* @method remove
* @instance
* @memberOf User
* @param {string} key - 键
* @param {User~removeCallback} cb - 回调函数
*/
/**
* @callback User~removeCallback
* @param {string} data - 'OK'表示成功
*/
User.prototype.remove = function(key, cb) {
    this.set(key, undefined, cb);
};

/**
* 处理通信的方法
* @method handle
* @instance
* @private
* @memberOf User
* @param {string} [method=set|get]
* @param {string} key
* @param {*} value
* @param {User~handleCallback} cb - 回调函数
*/
/**
* @callback User~handleCallback
* @param {string} data
*/
User.prototype.handle = function(method, key, value, cb) {

    var self = this;
    var uuid = self.uuid();

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

/**
* @class Transfer
* @classdesc 如果Manager是worker进城，就需要Master进城扮演通信的中转站
* @constructor
* @param {number} whoIsManager - Manager所在worker进程的id
* @return A new instance of Transfer
*/
var Transfer = function(whoIsManager) {
    cluster.on('online', function(worker) {
        worker.on('message', function(data) {
            if (!data.isSharedMemoryMessage) return;
            if (worker.id === whoIsManager) {
                // 转发给user
                cluster.workers[data.id].send(data);
                return;
            }
            // 转发给manager
            cluster.workers[whoIsManager].send(data);
        });
    });
};

/**
* 初始化函数，判断所在进程类型和设置，实例化相应的类
* @method init
* @param {object} [config]
* @param {number} [config.manager] - 如果需要用work进程做共享内存的manager，指定其worker.id即可
* @returns {instance} Manager | User | Transfer 的实例
* @example
* 
*/
function init(config) {

    config = config || {};

    var defaultConfig = {
        expire: 30 * 60 * 1000
    };

    // undefined => master | cluster_id => cluster
    var whoIsManager = config.manager || defaultConfig.manager;

    // Manager(cluster worker) <--> Transfer(cluster master) <--> User、User、User...(cluster worker)
    if (whoIsManager) {

        if(typeof whoIsManager !== 'number') {
            throw new Error(errDesc[1]);
            return;
        }
        
        if (cluster.isMaster) {
            return new Transfer(whoIsManager);
        }
        
        if(cluster.worker.id === whoIsManager) {
            return new Manager;
        }
        
        return new User;

    } else {

        // Manager(cluster master) <--> User(cluster worker)    
        if (cluster.isMaster) {
            return new Manager();
        }

        return new User;

    }

}

exports.Manager  = Manager;
exports.User     = User;
exports.Transfer = Transfer;
exports.init     = init;
