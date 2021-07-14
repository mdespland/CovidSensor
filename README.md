Use CO2 sensor to detect when it is needed to open the window

Based on RPI4, FIWARE NGSI-LD and Chirpstack

# FIWARE NGSI-LD

NGSI-LD is the new [FIWARE](https://fiware.org) standard. Several brocker are available, but Orion-LD is the only one small enough to work on a RPI4.

Problem Orion-LD is not available in dockerhub for arm64 ... so first I need to rebuild it

I have create a repo for that : [orion-ld-arm64](https://github.com/mdespland/orion-ld-arm64)

And all the images are now available on [dockerhub](https://dockerhub.com)

# Install the RPI4

* [RPI4 OS64 bit](https://downloads.raspberrypi.org/raspios_arm64/images/)
* [Tutorial Installation](https://raspberrytips.com/raspberry-pi-os-64-bits-vs-32-bits/)

Download an image [RPI4 OS64 bit](https://downloads.raspberrypi.org/raspios_arm64/images/) (here I choose the latest 2021-05-07-raspios-buster-arm64.img )

Copy the image on an SD card
```
sudo dd if=2021-05-07-raspios-buster-arm64.img of=/dev/disk2
```
Put it on the RPI and boot

In order to allow me to build the image I have increase the swapp size to 4096 (CONF_SWAPSIZE=4096 and CONF_MAXSWAP=4096) 
``` 
sudo dphys-swapfile swapoff
sudo vi /etc/dphys-swapfile 
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

better to reduce it after the build process

## Clone this repo

``` 
git clone https://github.com/mdespland/CovidSensor.git
cd CovidSensor
git submodule update --remote --recursive
``` 

# Install Lora Gateway (ChirpStack)

## The Gateway solution

To deploy the gateway solution with docker, we need to rebuild the differents images. All the built images have been pushed on dockerhub.

### Build the images

```
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
```

### Deploy the gateway

``` 
cd chirpstack
cp -R chirpstack-docker/configuration docker/
cd docker
docker-compose up -d
``` 
Then you can connect to the portal

Connect to the UI [http://127.0.0.1:8080](http://127.0.0.1:8080) ```admin/admin```
Connect to the API [http://127.0.0.1:8080/api](http://127.0.0.1:8080/api)
Configure a network server ```chirpstack-network-server:8000```

## The concentratord

It will be installed directly on the RPI4 host


```
cd chirpstack/chirpstack-concentratord
make build-native-release
sudo cp target/release/chirpstack-concentratord-sx1301 /usr/bin/
```


```
sudo cd chirpstack/concentratord
sudo mkdir -p /etc/chirpstack-concentratord/sx1301
sudo cp sx1301/*.toml  /etc/chirpstack-concentratord/sx1301/
sudo cp init.d/chirpstack-concentratord /etc/init.d/
sudo cp default/chirpstack-concentratord /etc/default/
sudo update-rc.d chirpstack-concentratord defaults
```

# Resources

## Documentation about ESP32 
* [Heltec ESP32 lora/wifi kit doc](https://heltec-automation-docs.readthedocs.io/en/latest/esp32/wifi_lora_32/index.html)
* [CO2 Sensor](https://wiki.dfrobot.com/CO2_Sensor_SKU_SEN0159)
* [ESP32 lora/wifi kit pinout](https://github.com/Heltec-Aaron-Lee/WiFi_Kit_series/blob/master/PinoutDiagram/WIFI_LoRa_32_V2.pdf)
* [ESP32 LoraWan](https://github.com/HelTecAutomation/ESP32_LoRaWAN)

## Documentation about RPI4
* [RPI4 OS64 bit](https://downloads.raspberrypi.org/raspios_arm64/images/)
* [Tutorial Installation](https://raspberrytips.com/raspberry-pi-os-64-bits-vs-32-bits/)

## Lora board 

* [ic880a-spi](https://wireless-solutions.de/products/lora-solutions-by-imst/radio-modules/ic880a-spi/)
* [ic880a-spi QuickStart Guide](https://webshop.ideetron.nl/Files/3/1000/1211/Attachments/Product/9Sl3U5tf7B238WGCZ1V7PRmw2768t90K.pdf)
* [Sample gateway](https://www.rs-online.com/designspark/building-a-raspberry-pi-powered-lorawan-gateway)
* [chirpstack](https://www.chirpstack.io)