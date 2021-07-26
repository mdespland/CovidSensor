#/bin/bash

docker push marcdespland/chirpstack-network-server:arm64
docker push marcdespland/chirpstack-application-server:arm64
docker push marcdespland/chirpstack-gateway-bridge:arm64
docker push marcdespland/orion-ld:FIWARE_8.0_arm64
docker push marcdespland/timescaledb-postgis:latest-pg12
docker push marcdespland/mintaka:latest