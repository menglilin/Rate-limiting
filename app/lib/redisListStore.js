const redis = require("ioredis");

const RedisListStore = function(options) {
  // create the client
  const client = redis.createClient(options.redisURL);
  const predix = "rl-" + options.appName + ":";

  //method to increase the count
  this.incr = (key, cb) => {
    const rdskey = predix + key;
    const now = new Date().getTime();

    // check request count by ip
    client.llen(rdskey, (err, res) => {
      if (err) {
        return cb(err);
      }
      //if the ip didn't reach the limitation add the new timestamp to list
      if (res < options.max) {
        client.lpush(rdskey, now, (err, res) => {
          if (err) {
            return cb(err);
          }

          return cb();
        });
      } else {
        // if the list equal max, get the earlist timestamp to check if this expired
        client.lindex(rdskey, -1, (err, res) => {
          if (err) {
            return cb(err);
          }

          let resetTime = parseInt(res) + parseInt(options.expire) - now;

          // if the earlest timstamp is not expired return the time remaining to user
          if (resetTime > 0) {
            return cb(null, resetTime);
          } else {
            // if the earlest timstamp is not expired add the new timestamp and delete the earlest one
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
        return err;
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
