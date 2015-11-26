local log = function(arg)
  redis.log(redis.LOG_NOTICE, arg)
end

local queue_cmd = KEYS[1]

if queue_cmd == 'JOIN' then
  local queue_name = KEYS[2]
  local consumer_id = KEYS[3]
  redis.call('SADD', queue_name, consumer_id)
  log(consumer_id .. ' has joined queue ' .. queue_name)
  return queue_name .. ':' .. consumer_id
elseif queue_cmd == 'LEAVE' then
  local queue_name = KEYS[2]
  local consumer_id = KEYS[3]
  redis.call('SREM', queue_name, consumer_id)
  redis.call('DEL', queue_name .. ':' .. v)
elseif queue_cmd == 'SAY' then
  local queue_name = KEYS[2]
  local msg = KEYS[3]
  local members = redis.call('SMEMBERS', queue_name)
  for i, v in ipairs(members) do
    local consumer_queue = queue_name .. ':' .. v
    log('msg ' .. msg .. ' on ' .. consumer_queue)
    local queue_length = redis.call('RPUSH', consumer_queue, msg)
    if queue_length > 5 then
      log('consumer too slow on queue ' .. consumer_queue)
      redis.call('DEL', consumer_queue)
    end
  end
else
  log('unknown command: ' .. tostring(queue_cmd))
end
