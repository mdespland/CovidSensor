/******************************************************************************
  Read basic CO2 and TVOCs

  Marshall Taylor @ SparkFun Electronics
  Nathan Seidle @ SparkFun Electronics

  April 4, 2017

  https://github.com/sparkfun/CCS811_Air_Quality_Breakout
  https://github.com/sparkfun/SparkFun_CCS811_Arduino_Library

  Read the TVOC and CO2 values from the SparkFun CSS811 breakout board

  A new sensor requires at 48-burn in. Once burned in a sensor requires
  20 minutes of run in before readings are considered good.

  Hardware Connections (Breakoutboard to Arduino):
  3.3V to 3.3V pin
  GND to GND pin
  SDA to A4
  SCL to A5

******************************************************************************/
#include <Wire.h>

#include "SparkFunCCS811.h" //Click here to get the library: http://librarymanager/All#SparkFun_CCS811

//#define CCS811_ADDR 0x5B //Default I2C Address
#define CCS811_ADDR 0x5A //Alternate I2C Address
#define debugSerial SerialUSB


CCS811 mySensor(CCS811_ADDR);

void setup()
{
  debugSerial.begin(115200);
  while (!debugSerial); 
  debugSerial.println("CCS811 Basic Example");

  Wire.begin(); //Inialize I2C Hardware

  if (mySensor.begin() == false)
  {
    debugSerial.print("CCS811 error. Please check wiring. Freezing...");uint16_t
    while (1)
      ;
  }
}

void loop()
{
  //Check to see if data is ready with .dataAvailable()
  if (mySensor.dataAvailable())
  {
    //If so, have the sensor read and calculate the results.
    //Get them later
    mySensor.readAlgorithmResults();

    debugSerial.print("CO2[");
    //Returns calculated CO2 reading
    debugSerial.print(mySensor.getCO2());
    debugSerial.print("] tVOC[");
    //Returns calculated TVOC reading
    debugSerial.print(mySensor.getTVOC());
    debugSerial.print("] millis[");
    //Display the time since program start
    debugSerial.print(millis());
    debugSerial.print("]");
    debugSerial.println();
  }

  delay(10); //Don't spam the I2C bus
}
