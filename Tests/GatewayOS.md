# Ressources

* [Gateway OS](https://www.chirpstack.io/gateway-os/install/raspberrypi/)


# Installation

* Download [RPI4 Image](https://artifacts.chirpstack.io/downloads/chirpstack-gateway-os/raspberrypi/raspberrypi4/3.4.0/chirpstack-gateway-os-full-raspberrypi4-20210510105124.rootfs.wic.gz) 


* Copy the image on SD card
```
sudo dd if=images/chirpstack-gateway-os-full-raspberrypi4-20210510105124.rootfs.wic of=/dev/disk2
```

* The reset pin is 22 but the GPIO number is 25