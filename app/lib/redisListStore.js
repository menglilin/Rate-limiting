const redis = require("ioredis");

const RedisListStore = function(options) {
  console.log(options);
  // create the client
  const client = redis.createClient(options.redisURL);
  const predix = "rl-" + options.appName + ":";

  //method to increase the count
  this.incr = (key, cb) => {
    const rdskey = predix + key;
    const now = new Date().getTime();

    // check request count
    client.llen(rdskey, (err, res) => {
      if (err) {
        return cb(err);
      }

      if (res < options.max) {
        client.lpush(rdskey, now, (err, res) => {
          if (err) {
            return cb(err);
          }
          return cb();
        });
      } else {
        client.lindex(rdskey, -1, (err, res) => {
          if (err) {
            return cb(err);
          }

          let resetTime = parseInt(res) + parseInt(options.expire) - now;

          if (resetTime > 0) {
            return cb(null, resetTime);
          } else {
            client.lpush(rdskey, now, (err, res) => {
              if (err) {
                return cb(err);
              }

              client.ltrim(rdskey, 0, options.max - 1, (err, res) => {
                if (err) {
                  return cb(err);
                }

                return cb();
              });
            });
          }
        });
      }
    });
  };

  // decrease the request count
  this.decrement = function(key) {
    const rdskey = predix + key;
    client.lpop(rdskey, (err, res) => {
      if (err) {
        return;
      }
    });
  };

  // reset the rate limit
  this.resetKey = function(key) {
    const rdskey = predix + key;
    client.del(rdskey, (err, res) => {
      if (err) {
        return err;
      }
      return res;
    });
  };
};

module.exports = RedisListStore;
