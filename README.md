Simple Redis MQ

* For now, at most once delivery
* Consumers can die and rejoin without too much pain
* Producers don't know about consumers
* Uses redis EVAL/EVALSHA feature

Docs:

```
var redisMQ = require('./index');

// initialize redis connection
redisMQ.initRedisClient();

// put a message on the queue
redisMQ.say("aaa1", "hello");

// join queue and read messages from queue
redisMQ.join("aaa1", "bbb1", function(err, result) {
  console.log("read from queue: ", result);
});
```

TODO:

* Unit tests
* Performance tests
* Optional at-least-once delivery
