FROM node:8
RUN apt-get update && apt-get install -y vim fakeroot
WORKDIR /opt
COPY ./wiringpi.control.patch /opt/
RUN git clone https://github.com/WiringPi/WiringPi.git
WORKDIR /opt/WiringPi
RUN patch debian-template/wiringPi/DEBIAN/control < ../wiringpi.control.patch
RUN WIRINGPI_SUDO="" ./build debian
RUN apt-get install ./debian-template/wiringpi-2.60-1.deb
RUN npm install -g node-gyp