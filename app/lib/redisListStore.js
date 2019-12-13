const redis = require("ioredis");

const RedisListStore = function(options) {
  // create the client
  const client = redis.createClient(options.redisURL);
  const prefix = "rl-" + options.appName + ":";

  //method to increase the count
  this.incr = (key, cb) => {
    const rdskey = prefix + key;
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

          cb();
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
            client
              .multi()
              .lpush(rdskey, now)
              .ltrim(rdskey, 0, options.max - 1)
              .exec((err, res) => {
                if (err) {
                  return cb(err);
                }
                cb();
              });
          }
        });
      }
    });
  };

  // decrease the request count
  this.decrement = function(key) {
    let rdskey = prefix + key;
    client.lpop(rdskey, (err, res) => {
      if (err) {
        return err;
      }
    });
  };

  // reset the rate limit of ip
  this.resetKey = function(key, cb) {
    let rdskey = prefix + key;
    client.del(rdskey, (err, res) => {
      if (err) {
        return cb(err);
      }
      cb(null, res);
    });
  };
};

module.exports = RedisListStore;
