var LinkedList = require('./linkedlist');

var CacheLRU = function(config) {
    
    var self = this;

    LinkedList.call(self);

};

CacheLRU.prototype = new LinkedList;

