#!/bin/sh

printf "module.exports = " > luamq.js
cat mq.lua | sed 's/$/\\n"+/' | sed 's/^/"/' >> luamq.js
printf "'';" >> luamq.js

