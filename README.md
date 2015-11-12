http-basic-proxy
============

http proxy server to change the route depending on the user.


config example
```
{
   "options":{
      "ssl":{
         "key":"./test/key.pem",
         "cert":"./test/cert.pem"
      },
      "users":{
         "root":"root",
         "admin":"123456",
         "etc":"o93rf2hi"
      },
      "targets":[
         {
            "user":"root",
            "url":"http://localhost:8080"
         },
         {
            "user":[
               "admin",
               "etc"
            ],
            "appendHeaders":{
               "personalid":"a530467209"
            },
            "url":"http://localhost:80"
         }
      ]
   },
   "port":"443"
}
```

run
```
$ node index.js
```