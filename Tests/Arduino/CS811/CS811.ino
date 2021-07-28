#include "Adafruit_CCS811.h"
#define debugSerial SerialUSB

Adafruit_CCS811 ccs;
void setup() {
  debugSerial.begin(115200);
 
    
  while (!debugSerial); // Wait for serial monitor
  debugSerial.println("CCS811 test");
  if (!ccs.begin()) {
    debugSerial.println("Failed to start sensor! Please check your wiring.");
    while (1);
  }
  //calibrate temperature sensor
  while (!ccs.available());
  float temp = ccs.calculateTemperature();
  ccs.setTempOffset(temp - 25.0);
}
void loop() {
  if (ccs.available()) {
    float temp = ccs.calculateTemperature();
    uint8_t error=ccs.readData();
    debugSerial.print("Error: ");
    debugSerial.print(error);
    if (!error) {
      debugSerial.print(" => CO2: ");
      debugSerial.print(ccs.geteCO2());
      debugSerial.print("ppm, TVOC: ");
      debugSerial.print(ccs.getTVOC());
      debugSerial.print("ppb Temp: ");
      debugSerial.println(temp);
    }
    else {
      debugSerial.println("ERROR!");
      //delay(500);
      //while (1);
    }
  }
  delay(500);
}
