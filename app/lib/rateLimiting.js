const RedisStore = require("./redisListStore");

function RateLimit(options) {
  /**
   *
   * redisURL : url -  the address of redis, underfined means localhost
   * appName: string - the predix of redis key
   * expire : milliseconds : how long of the rate limiting
   * max : int - how many times of user could request
   * message: string -  message for user when reach the max
   * statusCode: int - the statusCode to return to user when the reach the max
   * skipFailedRequests : boolean : Do not count failed requests (status >= 400)
   * handler : function : the function used when user is limited
   */
  options = Object.assign(
    {
      redisURL: undefined,
      appName: "",
      expire: 60 * 60 * 1000,
      max: 100,
      message: "",
      statusCode: 429,
      skipFailedRequests: false,
      handler: function(req, res, next) {
        console.log(res.message);
        if (options.message) {
          res.status(options.statusCode).send(options.message);
        } else {
          res.status(options.statusCode).send(res.message);
        }
      }
    },
    options
  );
  // store to use for persisting rate limit data
  const store = new RedisStore(options);

  // ensure that the store has the incr method
  if (
    typeof store.incr !== "function" ||
    typeof store.resetKey !== "function" ||
    (options.skipFailedRequests && typeof store.decrement !== "function")
  ) {
    throw new Error("The store is not valid.");
  }

  function rateLimit(req, res, next) {
    //init the key of rate limiting
    const key = req.ip.replace("::ffff:", "");

    //add the request to store
    store.incr(key, function(err, resetTime) {
      if (err) {
        return next(err);
      }

      // decrease the count when user did not request successfully
      if (options.skipFailedRequests) {
        let decremented = false;
        const decreaseCount = () => {
          if (!decremented) {
            store.decrement(key, res => {});
            decremented = true;
          }
        };

        res.on("finish", () => {
          if (res.statusCode >= 400 && res.statusCode != options.statusCode) {
            decreaseCount();
          }
        });

        res.on("close", () => {
          if (!res.finished) {
            decreaseCount();
          }
        });

        res.on("error", () => decreaseCount());
      }

      // if the request is limited reset the message to show how many seconds left
      if (resetTime) {
        if (options.message == "") {
          res.message =
            "Rate limit exceeded. Try again in " +
            Math.ceil(resetTime / 1000) +
            " seconds";
        }
        return options.handler(req, res, next);
      }
      next();
    });
  }
  // reset the request from the IP address
  rateLimit.resetKey = store.resetKey.bind(store);

  return rateLimit;
}

module.exports = RateLimit;
