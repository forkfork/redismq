var redis = require('redis');
var redisMQ = require('./index');

var queueConn = redisMQ.initRedisClient();

redisMQ.say(queueConn, "aaa1", "hello");

redisMQ.join(queueConn, "aaa1", "bbb1", function(err, result) {
  console.log("read from queue: ", result);
});

setTimeout(function() {
  redisMQ.leave(queueConn, "aaa1", "bbb1");
  queueConn.redisClient.quit()
}, 4000);
