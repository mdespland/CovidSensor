'use strict';


var Config = require('./config');
const axios = require('axios');

async function sendRequest(verb, path, body = "", contentType = "application/json", accept = "application/json") {
    var chirpstack = Config.ChirpstackAPI;
    var request = {
        method: verb,
        url: chirpstack + path,
        headers: {
            "Accept": accept,
            "Authorization": "Bearer " + Config.ChirpstackBearer
        },
        json: true
    };
    if (body !== "") {
        request.data = JSON.stringify(body);
        request.headers["Content-Type"] = contentType;
    }
    var response;
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

async function createNetworkServer() {
    var body = {
        "networkServer": {
            "name": "default",
            "server": "chirpstack-network-server:8000"
        }
    }
    try {
        var response = await sendRequest("POST", "/api/network-servers", body)
        return response.data.id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchNetworkServer() {
    try {
        var response = await sendRequest("GET", "/api/network-servers?limit=10")
        //console.log(JSON.stringify(response.data,null,4))
        var found = false;
        var i = 0;
        var id = "";
        while (!found && i < response.data.result.length) {
            found = (response.data.result[i].server === "chirpstack-network-server:8000")
            if (found) id = response.data.result[i].id;
            i++;
        }
        return id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function createServiceProfile(networkserverid) {
    var body = {
        "serviceProfile": {
            "name": "default",
            "organizationID": "1",
            "networkServerID": networkserverid
        }
    }
    try {
        var response = await sendRequest("POST", "/api/service-profiles", body)
        return response.data.id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchServiceProfile(networkserverid) {
    try {
        var response = await sendRequest("GET", "/api/service-profiles?limit=10")
        //console.log(JSON.stringify(response.data,null,4))
        var found = false;
        var i = 0;
        var id = "";
        while (!found && i < response.data.result.length) {
            found = ((response.data.result[i].name === "default") && (response.data.result[i].networkServerID === networkserverid))
            if (found) id = response.data.result[i].id;
            i++;
        }
        return id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function createGateway(networkserverid, serviceprofileid) {
    var body = {
        "gateway": {
            "id": Config.GatewayMac,
            "description": "Lora Gateway ic880a-spi",
            "discoveryEnabled": true,
            "name": "ic880a-spi",
            "networkServerID": networkserverid,
            "serviceProfileID": serviceprofileid,
            "organizationID": "1",
            "location": { "latitude": 0, "longitude": 0, "altitude": 0, "source": "UNKNOWN", "accuracy": 0 }
        }
    }
    try {
        var response = await sendRequest("POST", "/api/gateways", body)
        return Config.GatewayMac;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchGateway(networkserverid, serviceprofileid) {
    try {
        var response = await sendRequest("GET", "/api/gateways?limit=10")
        //console.log(JSON.stringify(response.data,null,4))
        var found = false;
        var i = 0;
        var id = "";
        while (!found && i < response.data.result.length) {
            found = (response.data.result[i].id === Config.GatewayMac)
            if (found) id = response.data.result[i].id;
            i++;
        }
        return id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchApplication(networkserverid, serviceprofileid) {
    try {
        var response = await sendRequest("GET", "/api/applications?limit=20")
        //console.log(JSON.stringify(response.data,null,4))
        var found = false;
        var i = 0;
        var id = "";
        while (!found && i < response.data.result.length) {
            found = (response.data.result[i].name === Config.ApplicationName)
            if (found) id = response.data.result[i].id;
            i++;
        }
        return id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function createApplication(networkserverid, serviceprofileid) {
    var body = {
        "application": {
          "description": "Monitore CO2 to detect risk about COVID19",
          "name": Config.ApplicationName,
          "organizationID": "1",
          "serviceProfileID": serviceprofileid
        }
      }
    try {
        var response = await sendRequest("POST", "/api/applications", body)
        return response.data.id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchDeviceProfile(networkserverid, serviceprofileid) {
    try {
        var response = await sendRequest("GET", "/api/device-profiles?limit=20")
        //console.log(JSON.stringify(response.data,null,4))
        var found = false;
        var i = 0;
        var id = "";
        while (!found && i < response.data.result.length) {
            found = (response.data.result[i].name === Config.ApplicationName)
            if (found) id = response.data.result[i].id;
            i++;
        }
        return id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function createDeviceProfile(networkserverid, serviceprofileid) {
    var body = 
      {
        "deviceProfile": {
          "name": Config.ApplicationName,
          "networkServerID": networkserverid,
          "organizationID": "1",
          "uplinkInterval": "600s",
          "macVersion":"1.0.0",
          "regParamsRevision":"A",
          "adrAlgorithmID":"default",
          "supportsJoin":true
        }
      }
    try {
        var response = await sendRequest("POST", "/api/device-profiles", body)
        return response.data.id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchDevice(deviceprofileid, applicationid) {
    try {
        var response = await sendRequest("GET", "/api/devices?limit=30&applicationID="+applicationid)
        //console.log(JSON.stringify(response.data,null,4))
        var found = false;
        var i = 0;
        var id = "";
        while (!found && i < response.data.result.length) {
            found = (response.data.result[i].devEUI === Config.devEUI)
            if (found) id = Config.devEUI;
            i++;
        }
        return id;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function createDevice(deviceprofileid, applicationid) {
    var body = {
        "device": {
          "applicationID": applicationid,
          "description": "Remote CO2 sensor based on ESP32",
          "devEUI": Config.devEUI,
          "deviceProfileID": deviceprofileid,
          "isDisabled": false,
          "name": "ESP32-CO2-01"
        }
      }
    try {
        var response = await sendRequest("POST", "/api/devices", body)
        return Config.devEUI;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function createDeviceKeys() {
    var body = {
        "deviceKeys": {
          "appKey": Config.appKey,
          "devEUI": Config.devEUI,
          "nwkKey": Config.nwkKey,
          "genAppKey": ""
        }
      }
    try {
        var response = await sendRequest("POST", "/api/devices/"+Config.devEUI+"/keys", body)
        return Config.devEUI;
    } catch (error) {
        return Promise.reject(error)
    }
}

async function searchDeviceKeys() {
    try {
        var response = await sendRequest("GET", "/api/devices/"+Config.devEUI+"/keys")
        //console.log(JSON.stringify(response.data,null,4))
        return true
    } catch (error) {
        return false
    }
}

async function searchApplicationHttpIntegration(appid) {
    try {
        var response = await sendRequest("GET", "/api/applications/"+appid+"/integrations/http")
        console.log(JSON.stringify(response.data,null,4))
        return true;
    } catch (error) {
        return false
    }
}

async function createApplicationHttpIntegration(appid) {
    var body = {
        "integration": {
          "applicationID": appid,
          "eventEndpointURL": Config.eventEndpointURL,
          "marshaler": "JSON"
        }
      }
    try {
        var response = await sendRequest("POST", "/api/applications/"+appid+"/integrations/http", body)
        return true;
    } catch (error) {
        return Promise.reject(error)
    }
}
/*{
    "integration": {
      "ackNotificationURL": "string",
      "applicationID": "string",
      "errorNotificationURL": "string",
      "eventEndpointURL": "string",
      "headers": [
        {
          "key": "string",
          "value": "string"
        }
      ],
      "integrationNotificationURL": "string",
      "joinNotificationURL": "string",
      "locationNotificationURL": "string",
      "marshaler": "JSON",
      "statusNotificationURL": "string",
      "txAckNotificationURL": "string",
      "uplinkDataURL": "string"
    }
  }*/

(async () => {
    var networkserverid = await searchNetworkServer()
    if (networkserverid === "") {
        networkserverid = await createNetworkServer();
    }
    console.log("Network server ID \t: " + networkserverid)
    var serviceprofileid = await searchServiceProfile(networkserverid)
    if (serviceprofileid === "") {
        serviceprofileid = await createServiceProfile(networkserverid)
    }
    console.log("Service Profile ID\t: " + serviceprofileid)
    var gatewayid = await searchGateway(networkserverid, serviceprofileid)
    if (gatewayid === "") {
        gatewayid = await createGateway(networkserverid, serviceprofileid)
    }
    console.log("Gateway ID \t\t: " + gatewayid)
    var appid = await searchApplication(networkserverid, serviceprofileid)
    if (appid === "") {
        appid = await createApplication(networkserverid, serviceprofileid)
    }
    console.log("Application ID \t\t: " + appid)
    var deviceprofileid = await searchDeviceProfile(networkserverid, serviceprofileid)
    if (deviceprofileid === "") {
        deviceprofileid = await createDeviceProfile(networkserverid, serviceprofileid)
    }
    console.log("DeviceProfile ID \t: " + deviceprofileid)
    var deviceid = await searchDevice(deviceprofileid, appid)
    if (deviceid === "") {
        deviceid = await createDevice(deviceprofileid, appid)
    }
    console.log("Device ID \t\t: " + deviceid)
    if (!await searchDeviceKeys()) {
        await createDeviceKeys()
    }
    if (!await searchApplicationHttpIntegration(appid)) {
        await createApplicationHttpIntegration(appid)
    }
})().catch(error => {
    console.log(error)
})
