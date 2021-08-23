//
// Copyright 2018-2020 Orange
//
// See the NOTICE file distributed with this work for additional information
// regarding copyright ownership.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

'use strict'

const fs = require('fs');

module.exports = {
    OrionAPIURL: process.env.ORION_API_URL || "http://127.0.0.1/ngsi-ld/v1",
    MintakaAPIURL: process.env.MINTAKA_API_URL || "http://127.0.0.1",
    APPAPIURL: process.env.APP_API_URL || "http://127.0.0.1",
    BasePath: process.env.BASE_PATH_NGSILD || "/ngsi-ld/v1",
    ProxyListenPort: process.env.PROXY_LISTEN_PORT || 8080,
    ProxyListenIP: process.env.PROXY_LISTEN_IP || "0.0.0.0",
    OAuth2Bearer: readSecret("OAUTH2_BEARER", "changeit"),
    ConfigPassword: readSecret("CONFIG_PASSWORD", "changeit"),
    AgentToken: readSecret("AGENT_TOKEN", "agent_changeit"),
    DefaultToken: readSecret("DEFAULT_TOKEN", "default_changeit"),
}

function readSecret(key, value) {
    var result = "";
    if (process.env.hasOwnProperty(key + "_FILE")) {
        try {
            result = fs.readFileSync(process.env[key + "_FILE"], "utf8").trim();
        } catch (error) {
            console.log("Can't read secret file for "+key+ " : "+ process.env[key + "_FILE"]);
            result= value;
        }
    } else {
        if (process.env.hasOwnProperty(key)) {
            result = process.env[key];
        } else {
            result= value;
        }
    }
    return result;
}