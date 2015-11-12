http-basic-proxy
============

http proxy server to change the route depending on the user.


config example
```
{
   "options":{
      "ssl":{ // if you want to run the server with ssl, you can use the option
         "key":"./test/key.pem",
         "cert":"./test/cert.pem"
      },
      "users":{ // user list
         "root":"root",
         "admin":"123456",
         "etc":"o93rf2hi"
      },
      "targets":[
         {
            "user":"root", // accepted user
            "url":"http://localhost:8080" // target host
         },
         {
            "user":[ // accepted users
               "admin",
               "etc"
            ],
            "appendHeaders":{ // if you want to append headers, you can use the option
               "personalid":"a530467209"
            },
            "url":"http://localhost:80" // target host
         }
      ]
   },
   "port":"443" // the server port
}
```

run
```
$ node index.js
```