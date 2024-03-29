# Rate-limiting

### Store methods

#### Situation

Generally, there are two store methods mainly be used in request rate limiting: **memory** and **Redis key-value** form.
The principle of these two methods is to store the key-value pairs of the accessed IP and count number, and clear them when expired.

However, this key-value method cannot limit the user's requests to access only 100 times in every 60 minutes.  
For example: When a user requests once in the first minute, then requests 99 times in the 59th minute. And in the 62nd minute, key-value limitation refreshed, he can request 100 times again. However, he requested 199 times from 50th minutes to 110th minutes which is also 60 minutes.

#### To solve this situation, there are two options:

1. **Redis List**: When the request comes, check whether the length of the List is greater than max. If not, insert the latest timestamp into the head of the List. Otherwise, get the last record in the List, check whether it is expired. Delete it if expiration and insert the latest one into the head of the List.
2. **Redis Sorted Set**: When the request comes , get the whole request timestamps that have not expired in the Sorted Set and check whether the count greater than max. If not, add the latest request timestamp to the set. Otherwise, access is denied.

#### Decision

Comparing them, I chose to use the Sorted Set. Because the sorted set is storing data in hash and the time complexity is low. Besides, the Redis List needs to be checked at the logical level, then Redis is called for deletion and writing respectively. It cannot prevent concurrency. With the Sorted Set, we can just use get and write functions to finish the whole process. It could prevent concurrency effectively. We can also delete expired data in the process for saving memory.

Therefore, in this challenge, I have used **Redis Sorted set** method as the store strategy. To make the rate-limiting can be achieved smoothly in every 60 minutes with a good performance.

#### Suggestion

Although Redis sorted set could cover more situations than key-value with good performance, The memory utilization of the Key-value is higher. It has also been proven that in reality, key-value form is sufficient to meet the most requirments of rate-limiting. So, if there is no special requirement that must limit the request rate in every 60 minutes, it is recommended to use the Redis key-value method. It is good enough with better performance.

## Demo for testing

### install

    npm install

- Please install Redis on your device and run it before run the demo

### Document structure

- The rate-limiting files are: **rateLimiting.js** and **redisSortedSetStore.js**

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

The unit testing : a user could request 5 times in every 2minuts.
The remaining time will be displayed on the page when the user reaches the limitation.

    Rate limit exceeded. Try again in 117 seconds

If you want to reset the rate-limiting of the demo, please go to http://127.0.0.1:3002/reset
And click the **reset** button. Then this user could request 5 times again. This is the Reset Demo page, so the IP address is defined for localhost.

## Usage

Apply the rate limiting API on the demo page:

```javascript
const rateLimit = require("./app/lib/rateLimiting.js");
const rateLimiting = new rateLimit({
  appName: "test",
  expire: 2 * 60 * 1000, // 2 minutes
  max: 5
});
app.use("/demo", rateLimiting);
```

As an API to reset rate limiting with IP:

```javascript
const rateLimit = require("./app/lib/rateLimiting.js");
const rateLimiting = new rateLimit({
  appName: "test"
});

//const key = '';
rateLimiting.resetKey(key, function(err, result) {
  // 
});
```

### Configuration options

#### redisURL: URL

The URL address of Redis to be connected, undefined means 127.0.0.1:6379

#### appName: string

Will be added in the prefix of the key in Redis

#### expire : milliseconds

How long of the set of rate-limiting

#### max : int

How many times of user could request

#### message: string

Message return to the user when reaching the max

#### statusCode: int

The statusCode to return to the user when reaching the max

#### skipFailedRequests : boolean

Do not count failed requests, status >= 400 and status != statusCode( which was set before)

#### handler(res,req,next) : function

The function used the request is limited

#### store : new Function()

For extending: change to another store function. This functions must implement increase, decrease and resetKey functions.
