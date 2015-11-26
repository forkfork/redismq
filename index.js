var crypto = require('crypto');
var luaMQ = require('./luaMQ');
var redis = require('redis');
var luaMQsha = crypto.createHash('sha1').update(luaMQ).digest('hex');

var state = {
  redisClient: null,
  queues: {}
};

var redisOnError = function(err, callback) {
  if (callback) {
    return callback(err);
  }
};

var redisOnResult = function(result, callback) {
  if (callback) {
    return callback(null, result);
  }
};

var wait = function(queueName, consumerName, callback) {
  if (state.queues[queueName + ":" + consumerName] == "LEAVING" ||
      state.queues[queueName + ":" + consumerName] == "DISCONNECTING") {
    delete state.queues[queueName + ":" + consumerName];
    return;
  }
  state.redisClient.blpop(queueName + ":" + consumerName, 5, function(err, result) {
    if ((err || result) && callback) {
      callback(err, result);
    }
    setImmediate(function() {
      wait(queueName, consumerName, callback);
    });
  });
};

var run = function (cmd, arg1, arg2, callback) {
  if (!state.redisClient) {
    return redisOnError(new Error("redisClient not initialized for luaMQ"), callback);
  }
  state.redisClient.evalsha(luaMQsha, 3, cmd, arg1, arg2, function (err, result) {
    if (err && err.code == "NOSCRIPT") {
      state.redisClient.eval(luaMQ, 3, cmd, arg1, arg2, function(err, result) {
        if (err) {
          return redisOnError(err, callback);
        } else {
          redisOnResult(result);
        };
      });
    } else if (err) {
      return redisOnError(err, callback);
    } else {
      return redisOnResult(result, callback);
    }
  });
};

var join = function(queueName, consumerName, callback) {
  return run("JOIN", queueName, consumerName, function(err, result) {
    if (err) {
      return callback(err);
    }
    state.queues[queueName + ":" + consumerName] = "JOIN";
    wait(queueName, consumerName, callback);
  });
};

var leave = function(queueName, consumerName, callback) {
  state.queues[queueName + ":" + consumerName] = "LEAVING";
  return run("LEAVE", queueName, consumerName, callback);
};

var disconnect = function(queueName, consumerName) {
  state.queues[queueName + ":" + consumerName] = "DISCONNECTING";
  return;
};

var say = function(queueName, message, callback) {
  return run("SAY", queueName, message, callback);
};

var injectRedisClient = function (redisClientInjection) {
  state.redisClient = redisClientInjection;
};

var initRedisClient = function (redisClientInjection) {
  state.redisClient = redis.createClient();
};

module.exports = {
  state: state,
  injectRedisClient: injectRedisClient,
  initRedisClient: initRedisClient,
  join: join,
  leave: leave,
  say: say
}
