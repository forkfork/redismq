var redisMQ = require('./index');

redisMQ.initRedisClient();

redisMQ.say("aaa1", "hello");

redisMQ.join("aaa1", "bbb1", function(err, result) {
  console.log("read from queue: ", result);
});

setTimeout(function() {
  redisMQ.leave("aaa1", "bbb1");
  redisMQ.state.redisClient.quit()
}, 4000);
