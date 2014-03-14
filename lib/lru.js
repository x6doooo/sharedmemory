/* Todo

  record = {
    key, value, count, expire
  }

  used = {
    0: {
      key: record,
      key: record
    },
    1: {
      ...
    }
  };

  usedLength = {
    0: 10,
    1: 11,
    3: 100
  };

  expire = linkedlist;

*/


var LinkedList = require('./linkedlist');

var CacheLRU = function(config) {
    
  var self = this;

  LinkedList.call(self);

  config = config || {};

  // default -> 30min | number | undefined => closed
  self.__expire__ = config.expire == 'default' ? 30 * 60 * 1000 : config.expire;

  self.__max__ = config.max || 10000;

};

CacheLRU.prototype = new LinkedList;

CacheLRU.prototype.set = function(key, value) {

    if (typeof value == 'undefined') {
        this.remove(key);
    }

    var self = this;
    var __list__ = self.__list__;
    var record = __list__[key];

    if (!record) {

        record = {
            key: key,
            value: value,
            count: 0,
            deadline: Date.now() + self.defaultExpire
        };

    } else {

        record.deadline = Date.now() + self.defaultExpire;
        record.value = value;
        record.count += 1;
        this.remove(key);

    }

    this.unshift(record);

};
