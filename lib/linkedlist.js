// 链表

var LinkedList = function() {
    var self = this;
    self.__list__ = {};
    self.__length__ = 0;
    self.__head__ = undefined;
    self.__tail__ = undefined;
};


LinkedList.prototype.remove = function(key) {
    
    var __list__ = this.__list__;
    var record = __list__[key];
    
    if (!record) return;

    __list__[key] = undefined;
    this.__length__ -= 1;

    var recNext = record.next;
    var recPrev = record.prev;

    if (recNext && recPrev) {
        recNext.prev = recPrev;
        recPrev.next = recNext;
        return;
    }

    if (recNext) {
        this.__head__ = recNext;
        recNext.prev = undefined;
        return;
    }

    if (recPrev) {
        this.__tail__ = recPrev;
        recPrev.next = undefined;
        return;
    }

    this.__head__ = this.__tail__ = undefined;

};

LinkedList.prototype.push = function(record) {

    this.__length__ += 1;
    
    if (!this.__tail__) {
        this.__head__ = this.__tail__ = record;
        return;
    }

    this.__tail__.next = record;
    record.prev = this.__tail__;
    record.next = undefined;
    this.__tail__ = record;

};

LinkedList.prototype.pop = function() {

    if (!this.__tail__) return;
    
    var record = this.__tail__;

    if (record.prev) {
        record.prev.next = undefined;
        this.__tail__ = record.prev;
    } else {
        this.__tail__ = this.__head__ = undefined;
    }

    this.__length__ -= 1;
    this.__list__[record.key] = undefined;
    return record;

};

LinkedList.prototype.unshift = function(record) {
    this.__list__[record.key] = record;
    this.__length__ += 1;
    if (!this.__head__) {
        this.__head__ = this.__tail__ = record;
        return;
    }
    this.__head__.prev = record;
    record.next = this.__head__;
    record.prev = undefined;
    this.__head__ = record;    
};

LinkedList.prototype.shift = function() {

    if (!this.__head__) return;

    var record = this.__head__;

    if (record.next) {
        record.next.prev = undefined;
        this.__head__ = record.next;
    } else {
        this.__head__ = this.__tail__ = undefined;
    }

    this.__tail__ -= 1;
    this.__list__[record.key] = undefined;
    return record;

};

module.exports = LinkedList;