var Cache = function(config) {

    var self = this;
    self.__cache__ = {};
    self.__length__ = 0;
    self.__head__ = undefined;
    self.__tail__ = undefined;

    config = config || {};

    self.defaultExpire = config.expire || 30 * 60 * 1000;
    config.update && self.update();

};

Cache.prototype.set = function(key, value) {

    if (typeof value == 'undefined') {
        this.remove(key);
    }

    var self = this;
    var __cache__ = self.__cache__;
    var record = __cache__[key];

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
    var record = this.__cache__[key];


    if (record) {
        var now = Date.now();
        if (record.deadline < now) {
            this.remove(key);
        } else {
            record.deadline = Date.now() + this.defaultExpire;
            value = record.value;
            this.remove(key);
            this.__cache__[key] = record;
            this.unshift(record);            
        }
    }

    return value;

};

Cache.prototype.remove = function(key) {
    
    var __cache__ = this.__cache__;
    var record = __cache__[key];
    
    if (!record) return;

    __cache__[key] = undefined;
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

Cache.prototype.push = function(record) {

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

Cache.prototype.pop = function() {

    if (!this.__tail__) return;
    
    var record = this.__tail__;

    if (record.prev) {
        record.prev.next = undefined;
        this.__tail__ = record.prev;
    } else {
        this.__tail__ = this.__head__ = undefined;
    }

    this.__length__ -= 1;
    this.__cache__[record.key] = undefined;
    return record;

};

Cache.prototype.unshift = function(record) {
    this.__cache__[record.key] = record;
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

Cache.prototype.shift = function() {

    if (!this.__head__) return;

    var record = this.__head__;

    if (record.next) {
        record.next.prev = undefined;
        this.__head__ = record.next;
    } else {
        this.__head__ = this.__tail__ = undefined;
    }

    this.__tail__ -= 1;
    this.__cache__[record.key] = undefined;
    return record;

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

Cache.prototype.print = function() {
    var o = this.__head__;
    while (o) {
        console.log(o.key + ' : ' + o.value + ' | ' + o.deadline);
        o = o.next;
    }
};

exports.init = function(config) {
    return new Cache(config);
};

