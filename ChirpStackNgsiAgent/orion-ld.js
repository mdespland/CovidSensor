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
'use strict';

const Config = require('./config');
const axios = require('axios');

module.exports = {
    compareContext,
    sendNGSILDRequest,
    sendRequest,
    entityExists,
    createEntity,
    createEntityUpsert,
    countEntitiesList,
    updateEntity,
    getEntity,
    getEntityAttributes,
    getEntitiesList,
    getType,
    getEntitiesOfType,
    deleteEntity,
    listSubscription,
    getSubscription,
    deleteSubscription,
    createSubscription,
    searchSubscription,
    deleteBatchEntities
}


// NGSI-LD functions
/* Get type no longer exists in NGSI-LD
The feature is emulated to keep the NGSI-V2 tests working
*/
async function getType(typeid) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/ngsi-ld/v1/entities?type=" + typeid,
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        if (Array.isArray(response.data) && response.data.length > 0) {
            return {
                type: typeid,
                count: response.data.length
            }
        } else {
            return Promise.reject("Type " + typeid + " not found")
        }
    } catch (error) {
        return Promise.reject("Type " + typeid + " not found")
    }
}

function compareContext(context1, context2) {
    var corecontext = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    var result = true;
    if (Array.isArray(context1)) {
        for (var i = 0; i < context1.length; i++) {
            if (context1[i] !== corecontext) {
                if (Array.isArray(context2)) {
                    result = result && (context2.includes(context1[i]))
                } else {
                    result = result && (context2 === context1[i]);
                }
            }
        }
    } else {
        if (context1 !== corecontext) {
            if (Array.isArray(context2)) {
                result = result && (context2.includes(context1))
            } else {
                result = result && (context2 === context1);
            }
        }
    }
    if (Array.isArray(context2)) {
        for (var i = 0; i < context2.length; i++) {
            if (Array.isArray(context1)) {
                result = result && (context1.includes(context2[i]))
            } else {
                result = result && (context1 === context2[i]);
            }
        }
    } else {
        if (Array.isArray(context1)) {
            result = result && (context1.includes(context2))
        } else {
            result = result && (context1 === context2);
        }
    }
    return result;
}

async function sendNGSILDRequest(verb, path, body = "", contentType = "application/json", accept="application/json", link="") {
    var orion = Config.OrionAPI;
    var request = {
        method: verb,
        url: orion + "/ngsi-ld/v1" + path,
        headers: {
            "Accept": accept,
            "X-Auth-Token": Config.AgentToken
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
//    if (Config.OrionService != "") request.headers["Fiware-Service"] = Config.OrionService;
//    if (Config.OrionServicePath != "") request.headers["Fiware-ServicePath"] = Config.OrionServicePath;
    try {
        response = await axios.request(request);
    } catch (error) {
        if ((error.hasOwnProperty("response")) && (error.response.hasOwnProperty("data"))) {
            console.log(JSON.stringify(error.response.data))
        }
        return Promise.reject(error)
    }
    return response
}


async function sendRequest(request, expected) {
    var response;
//    if (Config.OrionService != "") request.headers["Fiware-Service"] = Config.OrionService;
//    if (Config.OrionServicePath != "") request.headers["Fiware-ServicePath"] = Config.OrionServicePath;
    try {
        response = await axios.request(request);
    } catch (error) {
        return Promise.reject(error)
    }
    if (response.status === expected) {
        return response;
    } else {
        return Promise.reject(response.status + " " + response.statusText + " " + JSON.stringify(response.data))
    }
}

async function createEntity(entity, content = "application/ld+json", expected = 201, options = "") {
    var orion = Config.OrionAPI;
    var request = {
        method: 'POST',
        url: orion + "/ngsi-ld/v1/entities" + (options === "" ? "" : "?options=" + options),
        headers: {
            "Content-Type": content,
            "X-Auth-Token": Config.AgentToken
        },
        data: JSON.stringify(entity),
        json: true
    };
    try {
        var response = await sendRequest(request, expected);
        return response.headers.Link;
    } catch (error) {
        return Promise.reject("Can't create entity: " + error + " : " + JSON.stringify(entity))
    }
}

async function updateEntity(id, attrs) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'PATCH',
        url: orion + "/ngsi-ld/v1/entities/" + id + "/attrs",
        headers: {
            "Content-Type": "application/ld+json"
        },
        data: JSON.stringify(attrs),
        json: true
    };
    //console.log(JSON.stringify(request, null, 4))
    try {
        var response = await sendRequest(request, 204);
        return true;
    } catch (error) {
        return Promise.reject("Can't update entity: " + error)
    }
}

async function createEntityUpsert(entity, content = "application/ld+json", expected = 204, options = "") {
    var orion = Config.OrionAPI;
    var request = {
        method: 'POST',
        url: orion + "/ngsi-ld/v1/entityOperations/upsert" + (options === "" ? "" : "?options=" + options),
        headers: {
            "Content-Type": content
        },
        data: JSON.stringify(entity),
        json: true
    };
    try {
        var response = await sendRequest(request, expected);
        return response.headers.Link;
    } catch (error) {
        return Promise.reject("Can't create entity: " + error)
    }
}

async function deleteBatchEntities(entities, content = "application/json", expected = 200) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'POST',
        url: orion + "/ngsi-ld/v1/entityOperations/delete",
        headers: {
            "Content-Type": content
        },
        data: JSON.stringify(entities),
        json: true
    };
    try {
        var response = await sendRequest(request, expected);
        return response.errors;
    } catch (error) {
        if (error.hasOwnProperty("response")) {
            if (error.response.data.title === "Entities not found") {
                return [];
            } else {
                return Promise.reject("Can't delete entities: " + error)
            }
        } else {
            if (error === "204 ") { //To work with Scorpio
                return [];
            } else {
                return Promise.reject("Can't delete entities: " + error)
            }
        }
    }
}

async function entityExists(entityid, type = "") {
    /*
    Filter on type is useless now
    */
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/ngsi-ld/v1/entities/" + entityid + (type === "" ? "" : "?type=" + type),
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        return true;
    } catch (error) {
        return false;
    }

}

async function getEntitiesList(query = "") {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/ngsi-ld/v1/entities" + (query === "" ? "" : "?" + query),
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        return response.data;
    } catch (error) {
        return Promise.reject("Failed to retrieve list")
    }
}

async function deleteEntity(entityid, type = "") {
    var orion = Config.OrionAPI;
    var request = {
        method: 'DELETE',
        url: orion + "/ngsi-ld/v1/entities/" + entityid + (type === "" ? "" : "?type=" + type),
        headers: {},
        json: true
    };
    try {
        await sendRequest(request, 204);
        return true;
    } catch (error) {
        return false;
    }
}

async function getEntity(entityid, link = "", type = "", options = "", attrs = "", metadata = "") {
    var orion = Config.OrionAPI;
    var query = "";
    query += (type === "" ? "" : (query === "" ? "?" : "&") + "type=" + type)
    query += (options === "" ? "" : (query === "" ? "?" : "&") + "options=" + options)
    query += (attrs === "" ? "" : (query === "" ? "?" : "&") + "attrs=" + attrs)
    query += (metadata === "" ? "" : (query === "" ? "?" : "&") + "metadata=" + metadata)
    var request = {
        method: 'GET',
        url: orion + "/ngsi-ld/v1/entities/" + entityid + query,
        headers: {
            Accept: "application/ld+json"
        },
        json: true
    };
    if (link !== "") request.headers.Link = link;
    try {
        var response = await sendRequest(request, 200);
        return response.data;
    } catch (error) {
        return Promise.reject("Entity " + entityid + " not found")
    }
}




async function createSubscription(subscription) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'POST',
        url: orion + "/ngsi-ld/v1/subscriptions/",
        headers: {
            "Content-Type": "application/ld+json"
        },
        data: JSON.stringify(subscription),
        json: true
    };
    try {
        var response = await sendRequest(request, 201);
        if (response.hasOwnProperty("headers") && (response.headers.hasOwnProperty("location"))) {
            var location = response.headers.location;
            return location.replace("/ngsi-ld/v1/subscriptions/", "");
        } else {
            return Promise.reject(response)
        }
    } catch (error) {
        return Promise.reject("Can't create entity: " + error)
    }
}

async function deleteSubscription(id) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'DELETE',
        url: orion + "/ngsi-ld/v1/subscriptions/" + id,
        headers: {},
        json: true
    };
    try {
        await sendRequest(request, 204);
        return true;
    } catch (error) {
        return false;
    }
}

// NGSI-V2 functions not yet migrated



async function countEntitiesList(query = "") {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/v2/entities/" + (query === "" ? "" : "?" + query),
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        if (response.headers.hasOwnProperty("fiware-total-count")) {
            return parseInt(response.headers["fiware-total-count"]);
        } else {
            return Promise.reject("Missing fiware-total-count header");
        }
    } catch (error) {
        return Promise.reject("Failed to retrieve list")
    }
}





async function getEntityAttributes(entityid, type = "", options = "", attrs = "", metadata = "") {
    var orion = Config.OrionAPI;
    var query = "";
    query += (type === "" ? "" : (query === "" ? "?" : "&") + "type=" + type)
    query += (options === "" ? "" : (query === "" ? "?" : "&") + "options=" + options)
    query += (attrs === "" ? "" : (query === "" ? "?" : "&") + "attrs=" + attrs)
    query += (metadata === "" ? "" : (query === "" ? "?" : "&") + "metadata=" + metadata)
    var request = {
        method: 'GET',
        url: orion + "/v2/entities/" + entityid + "/attrs" + query,
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        return response.data;
    } catch (error) {
        return Promise.reject("Entity " + entityid + " not found")
    }
}





async function getEntitiesOfType(type, limit) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/v2/entities/?type=" + type + "&limit=" + limit,
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        return response.data;
    } catch (error) {
        return Promise.reject("Entity " + entityid + " not found")
    }
}

async function getSubscription(id) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/v2/subscriptions/" + id,
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        return response.data;
    } catch (error) {
        return Promise.reject("Entity " + entityid + " not found")
    }
}




async function listSubscription() {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/v2/subscriptions",
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        return response.data;
    } catch (error) {
        return Promise.reject("Entity " + entityid + " not found")
    }
}

async function searchSubscription(subscription) {
    var orion = Config.OrionAPI;
    var request = {
        method: 'GET',
        url: orion + "/v2/subscriptions",
        headers: {},
        json: true
    };
    try {
        var response = await sendRequest(request, 200);
        var found = false;
        var id = "";
        for (const elt of response.data) {
            if ((JSON.stringify(elt.subject) === JSON.stringify(subscription.subject)) &&
                (JSON.stringify(elt.notification.attrs) === JSON.stringify(subscription.notification.attrs)) &&
                (JSON.stringify(elt.notification.http) === JSON.stringify(subscription.notification.http))) {
                found = true;
                id = elt.id;
            }

        }
        if (found) {
            return id;
        } else {
            return Promise.reject("Subscription not found")
        }
    } catch (error) {
        return Promise.reject("Entity " + entityid + " not found")
    }
}
