local log = function(arg)
  redis.log(redis.LOG_NOTICE, arg)
end

local queue_cmd = KEYS[1]
local queue_name = KEYS[2]
local consumer_id = KEYS[3]
local consumer_queue = queue_name .. ':' .. consumer_id
local snapshot = queue_name .. '-snapshot'
local msg = KEYS[3]

if queue_cmd == 'JOIN' then
  local queue_exists = redis.call('EXISTS', consumer_queue)
  log('queue_exists ' .. tostring(queue_exists))
  if queue_exists == 0 then
    log(consumer_id .. ' has snapshotted queue ' .. queue_name)
    redis.call('RESTORE', consumer_queue, 0, redis.call('DUMP', snapshot))
  end
  redis.call('SADD', queue_name, consumer_id)
  log(consumer_id .. ' has joined queue ' .. queue_name)
  return consumer_queue
elseif queue_cmd == 'LEAVE' then
  redis.call('SREM', queue_name, consumer_id)
  redis.call('DEL', consumer_queue)
elseif queue_cmd == 'SAY' then
  local members = redis.call('SMEMBERS', queue_name)
  for i, v in ipairs(members) do
    local consumer_queue = queue_name .. ':' .. v
    log('msg ' .. msg .. ' on ' .. consumer_queue)
    local queue_length = redis.call('RPUSH', consumer_queue, msg)
    if queue_length > 1000 then
      log('consumer too slow on queue ' .. consumer_queue)
      redis.call('DEL', consumer_queue)
    end
  end
  local snapshot_length = redis.call('RPUSH', snapshot, msg)
  if snapshot_length > 100 then
    redis.call('LPOP', snapshot)
  end
else
  log('unknown command: ' .. tostring(queue_cmd))
end
