#!/bin/bash

docker-compose -f docker-compose-chirpstack.yaml -f docker-compose-orionld.yaml -f docker-compose-ngsi-agents.yaml up -d --build