Simple Redis MQ

* For now, at most once delivery
* Consumers can die and rejoin without too much pain
* Producers don't know about consumers
* Uses redis EVAL/EVALSHA feature

TODO:

* Unit tests
* Performance tests
* Optional at-least-once delivery
