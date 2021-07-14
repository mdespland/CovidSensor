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

# Install Lora Gateway (ChirpStack)


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