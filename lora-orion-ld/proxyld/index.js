
'use strict';


var Config = require('./config');
var OAuth2 = require('./oauth2');
const axios = require('axios');
const express = require('express');
var cors = require('cors');
const querystring = require('querystring')

//const config = require('../../ChirpStackMQTTPushNGSIAgent/config');
const app = express();
app.use(cors())

app.use(function (req, res, next) {
  var data = [];
  req.on('data', function (chunk) {
    data.push(chunk);
  });
  req.on('end', function () {
    req.body = Buffer.concat(data);
    next();
  });
});





app.all('/oauth2/token', async function (req, res, next) {
  console.log("OAUTH2 HANDLER")
  if (req.headers.hasOwnProperty("authorization")) {
    try {
      console.log("Body : " + req.body)
      var data = querystring.parse(req.body.toString('utf8'))
      console.log(JSON.stringify(data, null, 4))

      var response = {
        "access_token": await OAuth2.token(data.username, data.password, req.headers.authorization),
        "token_type": "bearer",
        "expires_in": 3600
      }
      res.json(response)
    } catch (error) {
      console.log(error)
      res.sendStatus(403)
    }
  } else {
    res.sendStatus(403)
  }
});

app.all(Config.BasePath + '/*', async function (req, res, next) {
  console.log("NGSILD HANDLER")
  if ((req.headers.hasOwnProperty("x-auth-token")) && (await OAuth2.authorize(req.headers["x-auth-token"], req.method, req.url, ""))) {
    console.log("IS AUTHORIZED")
    var base = req.url.substring(Config.BasePath.length);
    req.url = base;
    var host = Config.OrionAPIURL;
    console.log(req.url)
    if (base.startsWith("/temporal/entities")) {
      if (req.method === "GET") {
        host = Config.MintakaAPIURL;
      }
    }

    var request = {
      method: req.method,
      url: host + req.url,
      headers: req.headers,
      data: req.body
    };
    console.log("Request : " + req.url + " - " + request.url)
    delete request.headers.host;
    delete request.headers["content-length"];
    try {
      var response;
      response = await axios.request(request);
      res.statusCode = response.status
      for (var header in response.headers) {
        if (response.headers.hasOwnProperty(header)) {
          res.setHeader(header, response.headers[header])
        }
      }
      res.send(response.data);
    } catch (error) {
      if ((error.hasOwnProperty("response")) && (error.response !== undefined)) {
        res.statusCode = error.response.status
        for (var header in error.response.headers) {
          if (error.response.headers.hasOwnProperty(header)) {
            res.setHeader(header, error.response.headers[header])
          }
        }
        res.send(error.response.data);
      } else {
        console.log(error);
        res.sendStatus(500)
      }
    }
  } else {
    console.log("NOT AUTHORIZED")
    res.sendStatus(403)
  }
});

app.all('*', async function (req, res, next) {
  console.log("DEFAULT HANDLER")
  var host = Config.APPAPIURL;
  var request = {
    method: req.method,
    url: host + req.url,
    headers: req.headers,
    data: req.body
  };
  console.log("Request : " + req.url + " - " + request.url)
  delete request.headers.host;
  delete request.headers["content-length"];
  try {
    var response;
    response = await axios.request(request);
    res.statusCode = response.status
    res.setHeader("mde", "mytest1")
    for (var header in response.headers) {
      if (response.headers.hasOwnProperty(header)) {
        res.setHeader(header, response.headers[header])
      }
    }
    console.log(JSON.stringify(res.headers, null, 4))
    res.send(response.data);
  } catch (error) {
    if ((error.hasOwnProperty("response")) && (error.response !== undefined)) {
      res.statusCode = error.response.status
      for (var header in error.response.headers) {
        if (error.response.headers.hasOwnProperty(header)) {
          res.setHeader(header, error.response.headers[header])
        }
      }
      res.send(error.response.data);
    } else {
      //console.log(error);
      res.sendStatus(404)
    }
  }
});

app.listen(Config.ProxyListenPort, Config.ProxyListenIP);