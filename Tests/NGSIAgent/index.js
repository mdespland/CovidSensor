'use strict';



const express = require('express');
const { json } = require('express');
const app = express();
var server;


var response = undefined;

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

app.all('*', function (req, res, next) {
    response = {
        method: req.method,
        hostname: req.hostname,
        url: req.url,
        headers: req.headers,
        body: req.body.toString('binary')
    }
    res.json({ok: true});
    console.log(JSON.stringify(response, null, 4))
});

try {
    app.listen(8080, "0.0.0.0");
  } catch(error) {
    console.log(error);
  }