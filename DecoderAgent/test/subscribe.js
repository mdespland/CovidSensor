'use strict';



const express = require('express');
//const Config = require('./config');
const axios = require('axios');
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

app.all('/subscription/device/:deviceid', function (req, res, next) {
    response = {
        deviceid: req.params.deviceid,
        method: req.method,
        hostname: req.hostname,
        url: req.url,
        headers: req.headers,
        body: req.body.toString('binary')
    }
    res.json({ ok: true });
});

app.all('*', function (req, res, next) {
    response = {
        method: req.method,
        hostname: req.hostname,
        url: req.url,
        headers: req.headers,
        body: req.body.toString('binary')
    }
    res.json({ ok: true });
});


async function call(request, expected = 200, timeout = 500, step = 100) {
    //if (response!==undefined) delete response;
    response = undefined;
    var result;
    try {
        result = await axios.request(request);
    } catch (error) {
        return Promise.reject(error)
    }
    if (result.status === expected) {
        var delay = 0;
        while (delay < timeout && response === undefined) {
            await new Promise(r => setTimeout(r, step));
            delay += step;
        }
        if (response === undefined) {
            return Promise.reject("No response recieved after " + timeout + " ms")
        } else {
            return response;
        }
    } else {
        return Promise.reject(result.status + " " + result.statusText)
    }
}

function clearResponse() {
    response = undefined;
}

async function lastResponse(timeout = 500, step = 100) {
    var delay = 0;
    while (delay < timeout && response === undefined) {
        await new Promise(r => setTimeout(r, step));
        delay += step;
    }
    if (response === undefined) {
        return Promise.reject("No response recieved after " + timeout + " ms")
    } else {
        return response;
    }
}

module.exports = {
    call,
    clearResponse,
    lastResponse,
    listen(port) {
        server = app.listen(port);
    },
    close() {
        server.close();
    }
}