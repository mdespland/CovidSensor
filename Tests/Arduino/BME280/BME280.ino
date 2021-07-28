/*
  Communicate with BME280s with different I2C addresses
  Nathan Seidle @ SparkFun Electronics
  March 23, 2015

  Feel like supporting our work? Buy a board from SparkFun!
  https://www.sparkfun.com/products/14348 - Qwiic Combo Board
  https://www.sparkfun.com/products/13676 - BME280 Breakout Board

  This example shows how to connect two sensors on the same I2C bus.

  The BME280 has two I2C addresses: 0x77 (jumper open) or 0x76 (jumper closed)

  Hardware connections:
  BME280 -> Arduino
  GND -> GND
  3.3 -> 3.3
  SDA -> A4
  SCL -> A5
*/

#include <Wire.h>

#define debugSerial SerialUSB

#include "SparkFunBME280.h"
BME280 mySensorB; //Uses I2C address 0x76 (jumper closed)

void setup()
{
  debugSerial.begin(115200);
  while (!debugSerial); // Wait for serial monitor
  debugSerial.println("Example showing alternate I2C addresses");

  Wire.begin();

  mySensorB.setI2CAddress(0x76); //Connect to a second sensor
  if(mySensorB.beginI2C() == false) debugSerial.println("Sensor B connect failed");
}

void loop()
{

  debugSerial.print(" Humidity: ");
  debugSerial.print(mySensorB.readFloatHumidity(), 0);

  debugSerial.print(" Pressure: ");
  debugSerial.print(mySensorB.readFloatPressure(), 0);

  debugSerial.print(" Altimeter: ");
  debugSerial.print(mySensorB.readFloatAltitudeMeters(), 0);

  debugSerial.print(" Temp: ");
  //debugSerial.print(mySensorB.readTempC(), 2);
  debugSerial.print(mySensorB.readTempC(), 2);

  debugSerial.println();

  delay(1000);
}
