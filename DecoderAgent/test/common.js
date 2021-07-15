'use strict'
var Config = require('../config.js')
const fs = require('fs');
const axios = require('axios');
module.exports = {
    readSecret(key, value) {
        var result = "";
        if (process.env.hasOwnProperty(key + "_FILE")) {
            try {
                result = fs.readFileSync(process.env[key + "_FILE"], "utf8");
            } catch (error) {
                console.log("Can't read secret file for " + key + " : " + process.env[key + "_FILE"]);
                result = value;
            }
        } else {
            if (process.env.hasOwnProperty(key)) {
                result = process.env[key];
            } else {
                result = value;
            }
        }
        return result;
    },
    readBoolean(key, value) {
        var result = "";
        if (process.env.hasOwnProperty(key)) {
            if (process.env[key].toUpperCase() === "TRUE" || process.env[key].toUpperCase() === "YES") {
                result = true;
            } else {
                result = false;
            }
        } else {
            result = value;
        }
        return result;
    },
    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    async sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    },
    async sendRequest(verb, path, body = "", contentType = "application/json", accept="application/json", link="") {
        var orion = Config.OrionAPI;
        var request = {
            method: verb,
            url: orion + "/ngsi-ld/v1" + path,
            headers: {
                "Accept": accept
            },
            json: true
        };
        if (link!=="") {
            request.headers["Link"]=link;
        }
        if (body !== "") {
            request.data = JSON.stringify(body);
            request.headers["Content-Type"] = contentType;
        }
        var response;
        if (Config.OrionService != "") request.headers["Fiware-Service"] = Config.OrionService;
        if (Config.OrionServicePath != "") request.headers["Fiware-ServicePath"] = Config.OrionServicePath;
        try {
            response = await axios.request(request);
        } catch (error) {
            if ((error.hasOwnProperty("response")) && (error.response.hasOwnProperty("data"))) {
                if (Config.Debug) console.log(JSON.stringify(error.response.data))
            }
            return Promise.reject(error)
        }
        return response
    }
}