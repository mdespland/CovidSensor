Use CO2 sensor to detect when it is needed to open the window

Based on RPI4, FIWARE NGSI-LD and Chirpstack

[Details about the sensors](./Co2DeviceSensor.md) 

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

# Deploy the solution

```
cd lora-orion-ld
./install.sh
```


# Install Lora Gateway (ChirpStack)

## The Gateway solution

To deploy the gateway solution with docker, we need to rebuild the differents images. All the built images have been pushed on dockerhub.

## Connect the board

| Description | ic880a-spi | RPI4       |
|-------------|:----------:|:----------:|
| VDD  +5v    | 21 | 2 |
| GND         | 22 | 14 |
| GND         | 12 | 20 |
| Reset       | 13 | 22 |
| CLK         | 14 | 23 |
| MISO        | 15 | 21 |
| MOSI        | 16 | 19 |
| NSS         | 17 | 24 |


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

# Connecting 7inch screen

## RPI Official

Edit ```/boot/config.txt``` to comment the following lines

```
#dtoverlay=vc4-fkms-v3d
#max_framebuffers=2
```

## WaveShare 1024x600 (not tested yet)

Edit ```/boot/config.txt``` to comment the following lines

```
#dtoverlay=vc4-fkms-v3d
#max_framebuffers=2
```

And add the next one

```
max_usb_current=1
hdmi_force_hotplug=1
config_hdmi_boost=7
hdmi_group=2
hdmi_mode=88
hdmi_drive=1
hdmi_cvt 1024 600 60 6 0 0 0
```

# RPI Autostart

```
mkdir -p .config/lxsession/LXDE-pi
vi .config/lxsession/LXDE-pi/autostart
```

```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
#@xscreensaver -no-splash
@point-rpi
@/usr/bin/chromium --incognito --start-maximized --kiosk --disable-restore-session-state http://127.0.0.1:8082
@uncluster
@xset s off
@xset s noblank
@xset -dpms
```

Check the log after login to verify issues

```
at .xsession-errors
Xsession: X session started for pi at Fri 30 Jul 2021 10:45:53 PM CEST
dbus-update-activation-environment: setting DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
dbus-update-activation-environment: setting DISPLAY=:0
dbus-update-activation-environment: setting XAUTHORITY=/home/pi/.Xauthority
localuser:pi being added to access control list
dbus-update-activation-environment: setting USER=pi
dbus-update-activation-environment: setting LANGUAGE=en_US.UTF-8
dbus-update-activation-environment: setting TEXTDOMAIN=Linux-PAM
dbus-update-activation-environment: setting XDG_SESSION_TYPE=x11
dbus-update-activation-environment: setting HOME=/home/pi
dbus-update-activation-environment: setting DESKTOP_SESSION=lightdm-xsession
dbus-update-activation-environment: setting XDG_SEAT_PATH=/org/freedesktop/DisplayManager/Seat0
dbus-update-activation-environment: setting DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
dbus-update-activation-environment: setting LOGNAME=pi
dbus-update-activation-environment: setting XDG_SESSION_CLASS=user
dbus-update-activation-environment: setting PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/games:/usr/games
dbus-update-activation-environment: setting XDG_SESSION_PATH=/org/freedesktop/DisplayManager/Session0
dbus-update-activation-environment: setting XDG_RUNTIME_DIR=/run/user/1000
dbus-update-activation-environment: setting DISPLAY=:0
dbus-update-activation-environment: setting LANG=en_US.UTF-8
dbus-update-activation-environment: setting XDG_SESSION_DESKTOP=lightdm-xsession
dbus-update-activation-environment: setting XAUTHORITY=/home/pi/.Xauthority
dbus-update-activation-environment: setting XDG_GREETER_DATA_DIR=/var/lib/lightdm/data/pi
dbus-update-activation-environment: setting SHELL=/bin/bash
dbus-update-activation-environment: setting GDMSESSION=lightdm-xsession
dbus-update-activation-environment: setting NO_AT_BRIDGE=1
dbus-update-activation-environment: setting GPG_AGENT_INFO=/run/user/1000/gnupg/S.gpg-agent:0:1
dbus-update-activation-environment: setting LC_ALL=en_US.UTF-8
dbus-update-activation-environment: setting PWD=/home/pi
** Message: 22:45:55.096: main.vala:101: Session is LXDE-pi
** Message: 22:45:55.096: main.vala:102: DE is LXDE
** Message: 22:45:55.508: main.vala:133: log directory: /home/pi/.cache/lxsession/LXDE-pi
** Message: 22:45:55.508: main.vala:134: log path: /home/pi/.cache/lxsession/LXDE-pi/run.log
```


# Resources

## Documentation about ESP32 / Arduino
* [Heltec ESP32 lora/wifi kit doc](https://heltec-automation-docs.readthedocs.io/en/latest/esp32/wifi_lora_32/index.html)
* [CO2 Sensor](https://wiki.dfrobot.com/CO2_Sensor_SKU_SEN0159)
* [ESP32 lora/wifi kit pinout](https://github.com/Heltec-Aaron-Lee/WiFi_Kit_series/blob/master/PinoutDiagram/WIFI_LoRa_32_V2.pdf)
* [ESP32 LoraWan](https://github.com/HelTecAutomation/ESP32_LoRaWAN)
* [CCS811 Sparkfun Library](https://github.com/sparkfun/SparkFun_CCS811_Arduino_Library)

## Documentation about RPI4
* [RPI4 OS64 bit](https://downloads.raspberrypi.org/raspios_arm64/images/)
* [Tutorial Installation](https://raspberrytips.com/raspberry-pi-os-64-bits-vs-32-bits/)

## Lora board 

* [ic880a-spi](https://wireless-solutions.de/products/lora-solutions-by-imst/radio-modules/ic880a-spi/)
* [ic880a-spi QuickStart Guide](https://webshop.ideetron.nl/Files/3/1000/1211/Attachments/Product/9Sl3U5tf7B238WGCZ1V7PRmw2768t90K.pdf)
* [Sample gateway](https://www.rs-online.com/designspark/building-a-raspberry-pi-powered-lorawan-gateway)
* [chirpstack](https://www.chirpstack.io)

## Screen

* [Pierre Alexaline](https://gist.github.com/pierrealexaline/0aa6d38ccdcf6cb21fc4c22387a413be)
* [RPI config.txt](https://www.raspberrypi.org/documentation/configuration/config-txt/video.md)
* [WaveShare 7inch LCD C](https://www.waveshare.com/wiki/7inch_HDMI_LCD_(C))