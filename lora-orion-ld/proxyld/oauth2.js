'use strict'

var Config = require('./config.js')

module.exports = {
    token,
    authorize
}

var config_token=makeid(32);

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function token(login, password, bearer, scope="") {
    if (("Bearer "+Config.OAuth2Bearer)!==bearer) {
        if (Config.Debug) console.log("Invalid Bearer : request rejected")
        return Promise.reject("Invalid Bearer");
    }
    switch(login) {
        case "configuration" : 
            if (password === Config.ConfigPassword) {
                config_token=makeid(32)
                return config_token;
            } else {
                if (Config.Debug) console.log("Invalid Password for user configuration : request rejected")
                return Promise.reject("Invalid Password");
            }
            break;
        default:
            if (Config.Debug) console.log("Invalid User : request rejected")
            return Promise.reject("Invalid User");
            break;
    }
}

async function authorize(token, method, url, query) {
    switch(token) {
        case config_token:
            return true;
            break;
        case Config.DefaultToken:
            if (method==="GET") {
                return true;
            } else {
                return false;
            }
            break;
        case Config.AgentToken:
            return true;
            break;
        default:
            return false;
    }
    console.log("WRONG")
}