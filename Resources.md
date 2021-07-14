# Documentation about ESP32 
* [Heltec ESP32 lora/wifi kit doc](https://heltec-automation-docs.readthedocs.io/en/latest/esp32/wifi_lora_32/index.html)
* [CO2 Sensor](https://wiki.dfrobot.com/CO2_Sensor_SKU_SEN0159)
* [ESP32 lora/wifi kit pinout](https://github.com/Heltec-Aaron-Lee/WiFi_Kit_series/blob/master/PinoutDiagram/WIFI_LoRa_32_V2.pdf)
* [ESP32 LoraWan](https://github.com/HelTecAutomation/ESP32_LoRaWAN)

# Documentation about RPI4
* [RPI4 OS64 bit](https://downloads.raspberrypi.org/raspios_arm64/images/)
* [Tutorial Installation](https://raspberrytips.com/raspberry-pi-os-64-bits-vs-32-bits/)

```
sudo dd if=2021-05-07-raspios-buster-arm64.img of=/dev/disk2
```

```
apt update && apt -y upgrade
apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
apt update 
apt-get install docker-ce docker-ce-cli containerd.io
apt install libffi-dev
pip3 install docker-compose
```

 # Lora board 

* [ic880a-spi](https://wireless-solutions.de/products/lora-solutions-by-imst/radio-modules/ic880a-spi/)
* [ic880a-spi QuickStart Guide](https://webshop.ideetron.nl/Files/3/1000/1211/Attachments/Product/9Sl3U5tf7B238WGCZ1V7PRmw2768t90K.pdf)
* [Sample gateway](https://www.rs-online.com/designspark/building-a-raspberry-pi-powered-lorawan-gateway)
* [chirpstack](https://www.chirpstack.io)


```
git clone https://github.com/brocaar/chirpstack-docker.git
cd chirpstack-docker/
git clone https://github.com/brocaar/chirpstack-docker.git
git clone https://github.com/brocaar/chirpstack-network-server.git
cd chirpstack-network-server/
docker build -t chirpstack-network-server:arm64 .
cd ..
git clone https://github.com/brocaar/chirpstack-application-server.git
cd chirpstack-application-server/
docker build -t chirpstack-application-server:arm64 .
cd ..
git clone https://github.com/brocaar/chirpstack-gateway-bridge.git
cd chirpstack-gateway-bridge/
docker build -t chirpstack-gateway-bridge:arm64 .
cd ../chirpstack-docker/
# change the image with the arm64 ones
vi docker-compose.yml 
docker-compose  up -d
```

Connect to the UI [http://127.0.0.1:8080](http://127.0.0.1:8080) ```admin/admin```
Connect to the API [http://127.0.0.1:8080/api](http://127.0.0.1:8080/api)
Configure a network server ```chirpstack-network-server:8000```

```
git clone https://github.com/brocaar/chirpstack-concentratord.git
cd chirpstack-concentratord
make build-native-release
cp target/release/chirpstack-concentratord-sx1301 /usr/bin/
```


```
cd <master>/concentratord
mkdir -p /etc/chirpstack-concentratord/sx1301
cp sx1301/*.toml  /etc/chirpstack-concentratord/sx1301/
cp init.d/chirpstack-concentrator /etc/init.d/
cp default/chirpstack-concentratord /etc/default/
update-rc.d chirpstack-concentratord defaults
```


# Chirpstack Integration 

```
{
    "method": "POST",
    "hostname": "172.17.0.1",
    "url": "/mde/test?event=up",
    "headers": {
        "host": "172.17.0.1:8081",
        "user-agent": "Go-http-client/1.1",
        "content-length": "447",
        "content-type": "application/json",
        "accept-encoding": "gzip"
    },
    "body": "{\"applicationID\":\"1\",\"applicationName\":\"CovidCo2\",\"deviceName\":\"CovidSensor\",\"devEUI\":\"IjIzAACIiAI=\",\"rxInfo\":[],\"txInfo\":{\"frequency\":867100000,\"modulation\":\"LORA\",\"loRaModulationInfo\":{\"bandwidth\":125,\"spreadingFactor\":12,\"codeRate\":\"4/5\",\"polarizationInversion\":false}},\"adr\":true,\"dr\":0,\"fCnt\":160,\"fPort\":2,\"data\":\"AAECAw==\",\"objectJSON\":\"\",\"tags\":{},\"confirmedUplink\":true,\"devAddr\":\"AY4xYg==\",\"publishedAt\":\"2021-07-11T15:14:40.642748053Z\"}"
}
```

```
{
    "applicationID": "1",
    "applicationName": "CovidCo2",
    "deviceName": "CovidSensor",
    "devEUI": "IjIzAACIiAI=",
    "rxInfo": [],
    "txInfo": {
        "frequency": 867100000,
        "modulation": "LORA",
        "loRaModulationInfo": {
            "bandwidth": 125,
            "spreadingFactor": 12,
            "codeRate": "4/5",
            "polarizationInversion": false
        }
    },
    "adr": true,
    "dr": 0,
    "fCnt": 160,
    "fPort": 2,
    "data": "AAECAw==",
    "objectJSON": "",
    "tags": {},
    "confirmedUplink": true,
    "devAddr": "AY4xYg==",
    "publishedAt": "2021-07-11T15:14:40.642748053Z"
}
```



