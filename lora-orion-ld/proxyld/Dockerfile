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
ENV PROXY_LISTEN_PORT=8080
ENV PROXY_LISTEN_IP=0.0.0.0
ENV ORION_API_URL=http://orion:1026/ngsi-ld/v1
ENV MINTAKA_API_URL=http://mintaka:8080
ENV APP_API_URL=http://covidsensorui
ENV BASE_PATH_NGSILD=/ngsi-ld/v1
COPY ./wait-for-it.sh /
RUN chmod u+rx /wait-for-it.sh
ENTRYPOINT [ "/wait-for-it.sh", "--host=mintaka", "--port=8080", "--timeout=120", "--", "npm", "start"]