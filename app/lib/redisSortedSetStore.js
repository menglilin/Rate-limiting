const redis = require("ioredis");

const RedisSortedSetStore = function(options) {
  /**
   * default params
   *
   * redisURL : url -  the address of redis, underfined means localhost
   * appName: string - the predix of redis key
   * expire : milliseconds - how long of the rate limiting
   * max : int - how many times of user could request before expired
   */
  options = Object.assign(
    {
      redisURL: undefined,
      appName: "default",
      expire: 60 * 60 * 1000,
      max: 100
    },
    options
  );
  // create the client
  const client = redis.createClient(options.redisURL);
  const prefix = "rl-" + options.appName + ":";

  //increase the count
  this.increase = (key, cb) => {
    var rdskey = '"' + prefix + key + '"';
    const now = new Date().getTime();

    //get the requests timestamp list which hasn't expired
    var param = [rdskey, parseInt(now - options.expire), parseInt(now)];

    client
      .zrangebyscore(param)
      .catch(err => {
        return cb(err);
      })
      .then(res => {
        //check if the count reach the max, if not, add new timestamp to set
        if (res.length < options.max) {
          param = [rdskey, parseInt(now), parseInt(now)];

          client
            .zadd(param)
            .catch(err => {
              return cb(err);
            })
            .then(res => {
              return cb();
            });
        } else {
          // return the reset time and last request time
          var lastReq = res[parseInt(options.max - 1)];

          //delete the expired timestamp -- just for saving memory
          param = [rdskey, 0, parseInt(now - options.expire - 1)];
          client.zremrangebyscore(param).catch(err => {
            return cb(err);
          });

          cb(null, parseInt(lastReq) + parseInt(options.expire) - now, lastReq);
        }
      });
  };

  // decrease the request count, delete the last request timestamp in the set
  this.decrease = ({ key, lastReq }) => {
    let rdskey = prefix + key;

    param = ['"' + rdskey + '"', lastReq];

    client.zrem(param).catch(err => {
      return err;
    });
  };

  // reset the rate limit of ip
  this.resetKey = (key, cb) => {
    let rdskey = prefix + key;

    client.del('"' + rdskey + '"', (err, res) => {
      if (err) {
        return cb(err);
      }
      cb(null, res);
    });
  };
};

module.exports = RedisSortedSetStore;
