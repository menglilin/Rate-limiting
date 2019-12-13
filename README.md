# Rate-limiting

### Store methods 

In Generally, for request rate limiting, there are two store methods mainly be used : memory and Redis key-value form.
The principle of these two methods is to store the key-value pairs of the accessed IP and count number, and clear them when expried.

However, when the situation is as below, this key-value method cannot control user requests to access only 100 times during every 60 minutes : When a user requests once in the first minute, then requests 99 times in the 59th minute.And in the 62nd minute, key-value limitation refreshed, he can request 100 times again. As a result, in the 60 minutes from 50th minutes to 110th minutes, he requested 199 times.

In order to solve this situation, there are two options.  
1. Redis list: When the request comes, determine whether the value of the list is greater than max. If not, insert the latest timestamp into the head of the list. Otherwise, get the last record in the list, check whether it is expired. Delete it after expiration and insert the latest one into the head of the list. 
2. Redis sorted set: When the request comes in, get the request timestamps that has not expired in the sorted set and check whether the count greater than max. If not, add the latest request timestamp to the set. Otherwise, access is denied. 

Comparing them, I chose to use the sorted set. Because the sorted set is implemented with hash table and the time complexity is low. In addition, the list needs to be judged at the logical layer, and then redis is called for deletion and writing respectively. This cannot prevent concurrency. With a sorted set, just get and write, which can prevent concurrency effectively. We can also delete expired data while saving access, saving memory.


Therefore, in this challenge, I have used **Redis Sorted set** method as the store strategy. In order to make the rate limiting can be achieved smoothly within every 60 minutes base on a good performance.

### Suggestion

Although Redis sorted set could cover more situation and the performance also not bad. The memory utilization of Key-value method is high. And it can solve most situation. So, if there is no special requirement that must control the user to limit the access frequency in every 60 minutes, it is recommended to use the Redis key-value method.

## Run the demo for testing

### install

    npm install

* Please install Redis on your device and run it before run the demo

### Document structure

* The rate-limiting files are: rateLimiting.js and redisList.js

        app
            controllers
                demo.controller.js              -- Demo for testing
            lib
                rateLimiting.js                 -- **rateLimiting**
                redisSortedSetStore.js          -- **store file of rateLimiting**
            routes
                demo.routes.js                  -- Demo for testing
            views
                demo.pug                        -- Demo for tesing
                reset.pug                       -- Demo for reset Key
        public
            js
                main.js                         -- Demo for reset Key
        app.js                                  -- entrance of Demo

### Run

    node app.js

Then visit the website on http://127.0.0.1:3002/demo

The unit testing : user could request 5 times in every 2minuts.
The remaining time will be dispayed in the page when user reach the limitation.

    Rate limit exceeded. Try again in 117 seconds

If you want to reset the rate limiting of the demo, please goto http://127.0.0.1:3002/reset
And click the **reset** button. Then this user could request 5 times again. This function is just for the Demo, so the IP address is defined.

## Usage

As a API to apply the rate limiting on the demo page:

```javascript
var rateLimit = require("./app/lib/rateLimiting.js");
const rateLimiting = rateLimit({
  appName: "test",
  expire: 2 * 60 * 1000, // 2 minutes
  max: 5
});
app.use("/demo", rateLimiting);
```

As a API to reset rate limiting with IP:

```javascript
var rateLimit = require("./app/lib/rateLimiting.js");
const rateLimiting = rateLimit({
  appName: "test"
});
rateLimiting.resetKey(key, function(err, result) {
  if (!err) {
    res.json(result);
  } else {
    console.log(err);
  }
});
```

### Configuration options

#### redisURL: url

The url address of redis to be connected, underfined means 127.0.0.1:6379

#### appName: string

Will be added in the predix of redis key

#### expire : milliseconds

How long of the set of rate limiting

#### max : int

How many times of user could request

#### message: string

Message return to user when reach the max

#### statusCode: int

The statusCode to return to user when reach the max

#### skipFailedRequests : boolean

Do not count failed requests, status >= 400 and status != statusCode( which was set before)

#### handler(res,req,next) : function

The function used the request is limited
