var LinkedList = require('./linkedlist');

var CacheLRU = function(max) {
    
  var self = this;

  LinkedList.call(self);

  // 记录数上限
  self.__max__ = max || 10000;

  // 统计
  self.__total__ = 0;
  self.__miss__ = 0;
  self.__hit__ = 0;

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
      value: value
    };

  } else {
      
    record.value = value;
    this.remove(key);

  }

  this.unshift(record);

  if (this.__length__ > this.__max__) {
    this.pop();
  }

};

CacheLRU.prototype.get = function(key) {

  var value;
  var record = this.__list__[key];

  this.__total__++;

  if (record) {

    value = record.value;
    this.remove(key);
    this.__list__[key] = record;
    this.unshift(record);  
    this.__hit__++;

  } else {

    this.__miss__++;

  }

  return value;

};

exports.init = function(max){
  return new CacheLRU(max);
};
