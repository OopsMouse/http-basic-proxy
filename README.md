http-basic-proxy
============

http proxy server to change the route depending on the user.


config example
```
{
  "options": {
    "ssl": {
      "key": "./test/key.pem",
      "cert": "./test/cert.pem"
    },
   "users": {
     "root": "root",
     "admin": "123456",
     "etc": "o93rf2hi"
    // "user": "passwd"
    },
    "targets": [
      {
        "user": "root", // accepted user
        "url": "http://localhost:80"
      },
      {
        "user": "admin", // accepted user
        "appendHeaders": {
          "personalId": "a530467209"
        },
        "url": "http://localhost:8080"
      }
    ],
  },
  "port": "443"
}
```
