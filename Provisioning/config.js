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

module.exports = {
    GatewayMac: "dca632fffe684f93",
    devEUI: "2232330000888802",
    appKey: "00000000000000000000000000000000",
    nwkKey: "88888888888888888888888888886601",
    ApplicationName: "CovidCO2Monitoring",
    eventEndpointURL: "http://chirpstackagent:8080/chirpstack",
    ChirpstackAPI: process.env.CHIRPSTACK_API_URL || "http://172.17.0.1:8080",
    ChirpstackBearer: process.env.CHIRPSTACK_BEARER || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5X2lkIjoiMmU3ODdiZjEtMGQ1Yi00NjY0LThhMmUtMGE1MjlkNmIxOTZhIiwiYXVkIjoiYXMiLCJpc3MiOiJhcyIsIm5iZiI6MTYyNjMyNTQwNiwic3ViIjoiYXBpX2tleSJ9.92K12Qnd7gOkUn5T9ZXVDFZilR4Ww-cjmlghlKdN3-Q"
}