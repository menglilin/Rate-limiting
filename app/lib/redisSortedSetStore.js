const redis = require("ioredis");

const RedisListStore = function(options) {
  // create the client
  const client = redis.createClient(options.redisURL);
  const prefix = "rl-" + options.appName + ":";

  //method to increase the count
  this.incr = (key, cb) => {
    var rdskey = prefix + key;
    const now = new Date().getTime();

    var param = [
      '"' + rdskey + '"',
      parseInt(now - options.expire),
      parseInt(now)
    ];

    //get the requests timestamp list which hasn't expired from now-expire to now
    client
      .zrangebyscore(param)
      .catch(err => {
        return cb(err);
      })
      .then(res => {
        //check if the count reach max, if not, add new timestamp to set
        if (res.length < options.max) {
          param = ['"' + rdskey + '"', parseInt(now), parseInt(now)];
          client
            .zadd(param)
            .catch(err => {
              return cb(err);
            })
            .then(res => {
              return cb();
            });
        } else {
          // if the count reach max, delete the expired timestamp and return the reset time and last request time
          var lastReq = res[4];
          param = ['"' + rdskey + '"', 0, parseInt(now - options.expire - 1)];
          client
            .zremrangebyscore(param)
            .catch(err => {
              return cb(err);
            })
            .then(res => {
              cb(
                null,
                parseInt(lastReq) + parseInt(options.expire) - now,
                lastReq
              );
            });
        }
      });
  };

  // decrease the request count, delete the last request timestamp in the set
  this.decrement = function({ key, lastReq }) {
    let rdskey = prefix + key;
    param = ['"' + rdskey + '"', lastReq];
    client.zrem(param).catch(err => {
      return err;
    });
  };

  // reset the rate limit of ip
  this.resetKey = function(key, cb) {
    let rdskey = prefix + key;
    client.del('"' + rdskey + '"', (err, res) => {
      if (err) {
        return cb(err);
      }
      cb(null, res);
    });
  };
};

module.exports = RedisListStore;
