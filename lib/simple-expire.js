var LinkedList = require('./linkedlist');

var Cache = function(config) {

  var self = this;

  LinkedList.call(self);

  config = config || {};
  self.defaultExpire = config.expire || 30 * 60 * 1000;

  config.update && self.update();

};

Cache.prototype = new LinkedList;

Cache.prototype.set = function(key, value) {

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
      deadline: Date.now() + self.defaultExpire
    };

  } else {

    record.deadline = Date.now() + self.defaultExpire;
    record.value = value;
    this.remove(key);

  }

  this.unshift(record);

};

Cache.prototype.get = function(key) {

  var value;
  var record = this.__list__[key];

  if (record) {
    var now = Date.now();
    if (record.deadline < now) {
      this.remove(key);
    } else {
      record.deadline = Date.now() + this.defaultExpire;
      value = record.value;
      this.remove(key);
      this.__list__[key] = record;
      this.unshift(record);            
    }
  }

  return value;

};

Cache.prototype.print = function() {
  var o = this.__head__;
  while (o) {
    console.log(o.key + ' : ' + o.value + ' | ' + o.deadline);
    o = o.next;
  }
};

Cache.prototype.update = function(time) {

  time = time || 10 * 1000;
  var self = this;
  self.__updateTimer__ = setTimeout(function() {
    var now = self.lastUpdate = Date.now();
    while (self.__tail__ && self.__tail__.deadline < now) {
      self.pop();
    }
    self.update(time);
  }, time);

};

exports.init = function(config) {
  return new Cache(config);
};

