#
# Copyright 2018-2020 Orange
#
# See the NOTICE file distributed with this work for additional information
# regarding copyright ownership.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
FROM node
EXPOSE 8080
WORKDIR /app
COPY . /app/
RUN npm install
ENV ORION_API_URL=http://proxyld:8080
ENV AGENT_LISTEN_PORT=8080
ENV AGENT_LISTEN_IP=0.0.0.0
ENV SUBSCRIPTION_HOST=decoderagent
ENV DEVICE_LIST="{\"urn:ngsi-ld:AirQualityObserved:Co2:sensor1\": \"urn:ngsi-ld:Device:chirpstack:2232330000888802\"}"
ENTRYPOINT ["npm", "start"]