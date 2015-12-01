var crypto = require('crypto');
var luaMQ = require('./luaMQ');
var redis = require('redis');
var luaMQsha = crypto.createHash('sha1').update(luaMQ).digest('hex');

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

var wait = function(state, queueName, consumerName, callback) {
  if (state.queues[queueName + ":" + consumerName] == "LEAVING" ||
      state.queues[queueName + ":" + consumerName] == "DISCONNECTING") {
    delete state.queues[queueName + ":" + consumerName];
    return;
  }
  state.redisClient.blpop(queueName + ":" + consumerName, 5, function(err, result) {
    if (result) {
      result = result[1];
    }
    if ((err || result) && callback) {
      callback(err, result);
    }
    setImmediate(function() {
      wait(state, queueName, consumerName, callback);
    });
  });
};

var run = function (state, cmd, arg1, arg2, callback) {
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

var join = function(state, queueName, consumerName, callback) {
  return run(state, "JOIN", queueName, consumerName, function(err, result) {
    if (err) {
      return callback(err);
    }
    state.queues[queueName + ":" + consumerName] = "JOIN";
    wait(state, queueName, consumerName, callback);
  });
};

var leave = function(state, queueName, consumerName, callback) {
  state.queues[queueName + ":" + consumerName] = "LEAVING";
  return run(state, "LEAVE", queueName, consumerName, callback);
};

var disconnect = function(state, queueName, consumerName) {
  state.queues[queueName + ":" + consumerName] = "DISCONNECTING";
  return;
};

var say = function(state, queueName, message, callback) {
  return run(state, "SAY", queueName, message, callback);
};

var injectRedisClient = function (redisClientInjection) {
  var state = {
    redisClient: redisClientInjection,
    queues: {}
  };
  return state;
};

var initRedisClient = function (redisClientInjection) {
  var state = {
    redisClient: redis.createClient(),
    queues: {}
  };
  return state;
};

module.exports = {
  injectRedisClient: injectRedisClient,
  initRedisClient: initRedisClient,
  join: join,
  leave: leave,
  say: say,
  disconnect: disconnect
}
