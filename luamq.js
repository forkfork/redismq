module.exports = "local log = function(arg)\n"+
"  redis.log(redis.LOG_NOTICE, arg)\n"+
"end\n"+
"\n"+
"local queue_cmd = KEYS[1]\n"+
"\n"+
"if queue_cmd == 'JOIN' then\n"+
"  local queue_name = KEYS[2]\n"+
"  local consumer_id = KEYS[3]\n"+
"  redis.call('SADD', queue_name, consumer_id)\n"+
"  log(consumer_id .. ' has joined queue ' .. queue_name)\n"+
"  return queue_name .. ':' .. consumer_id\n"+
"elseif queue_cmd == 'LEAVE' then\n"+
"  local queue_name = KEYS[2]\n"+
"  local consumer_id = KEYS[3]\n"+
"  redis.call('SREM', queue_name, consumer_id)\n"+
"  redis.call('DEL', queue_name .. ':' .. v)\n"+
"elseif queue_cmd == 'SAY' then\n"+
"  local queue_name = KEYS[2]\n"+
"  local msg = KEYS[3]\n"+
"  local members = redis.call('SMEMBERS', queue_name)\n"+
"  for i, v in ipairs(members) do\n"+
"    local consumer_queue = queue_name .. ':' .. v\n"+
"    log('msg ' .. msg .. ' on ' .. consumer_queue)\n"+
"    local queue_length = redis.call('RPUSH', consumer_queue, msg)\n"+
"    if queue_length > 5 then\n"+
"      log('consumer too slow on queue ' .. consumer_queue)\n"+
"      redis.call('DEL', consumer_queue)\n"+
"    end\n"+
"  end\n"+
"else\n"+
"  log('unknown command: ' .. tostring(queue_cmd))\n"+
"end\n"+
'';