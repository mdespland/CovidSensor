/*
  Copyright (C) 2017 Orange

  This software is distributed under the terms and conditions of the 'Apache-2.0'
  license which can be found in the file 'LICENSE.txt' in this package distribution
  or at 'http://www.apache.org/licenses/LICENSE-2.0'.
*/

/* Orange LoRa Explorer Kit

  Version:     1.0-SNAPSHOT
  Created:     2017-02-15 by Karim BAALI
  Modified:    2017-04-21 by Halim BENDIABDALLAH
                2017-05-09 by Karim BAALI
               2017-10-27 by Karim BAALI
*/

#include <OrangeForRN2483.h>
#include <Wire.h>
#include "SparkFunCCS811.h" //Click here to get the library: http://librarymanager/All#SparkFun_CCS811
#include "SparkFunBME280.h"
# include "Sample.h"
//#define CCS811_ADDR 0x5B //Default I2C Address
#define CCS811_ADDR 0x5A //Alternate I2C Address
#define BME280_ADDR 0x76


#define         READ_SAMPLE_INTERVAL         50    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            30     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             3
#define         WAIT_BETWEEN_MESSAGE         600000     


#define debugSerial SerialUSB

// The following keys are for structure purpose only. You must define YOUR OWN.
const uint8_t appEUI[8] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
const uint8_t appKey[16] = {  0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 };
CCS811 ccs811(CCS811_ADDR);
BME280 bme280;

bool first = true;

bool joinNetwork()
{
  OrangeForRN2483.setDataRate(DATA_RATE_1); // Set DataRate to SF11/125Khz
  return OrangeForRN2483.joinNetwork(appEUI, appKey);
}

void setup() {
  debugSerial.begin(57600);

  while ((!debugSerial) && (millis() < 10000)) ;

  OrangeForRN2483.init();
  Serial.println("Initialization of the CCS811");
  Wire.begin();
  while (!ccs811.begin()) {
    Serial.println("Failed to start CCS811 ! Please check your wiring.");
    delay(2000);
  }
  Serial.println("Initialization of the BME280");
  bme280.setI2CAddress(BME280_ADDR);
  while (! bme280.beginI2C()) {
    debugSerial.println("Failed to start BME280 ! Please check your wiring.");
    delay(2000);
  }
}

void adjustEnvironmentalData(float * humidity, float * temperature, float * pressure, float * altitude)
{
  int i;
  int d;
  int j = 0;
  float buffer[READ_SAMPLE_TIMES][4];
  float v = 0;
  for (i = 0; i < READ_SAMPLE_TIMES; i++) {
    buffer[i][0] = 0;
    buffer[i][1] = 0;
    buffer[i][2] = 0;
    buffer[i][3] = 0;
  }
  debugSerial.println("Reading Sample");
  for (i = 0; i < READ_SAMPLE_TIMES; i++) {
    v = 0;
    //read humidity
    v = bme280.readFloatHumidity();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][0] != 0 && buffer[j][0] < v) j++;
    if (buffer[j][0] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][0] = buffer[k - 1][0];
    }
    buffer[j][0] = v;
    //readTemperature
    v = bme280.readTempC();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][1] != 0 && buffer[j][1] < v) j++;
    if (buffer[j][1] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][1] = buffer[k - 1][1];
    }
    buffer[j][1] = v;
    //readPressure
    v = bme280.readFloatPressure();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][2] != 0 && buffer[j][2] < v) j++;
    if (buffer[j][2] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][2] = buffer[k - 1][2];
    }
    buffer[j][2] = v;
    //readAltitude
    v = bme280.readFloatAltitudeMeters();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][3] != 0 && buffer[j][3] < v) j++;
    if (buffer[j][3] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][3] = buffer[k - 1][3];
    }
    buffer[j][3] = v;
    delay(READ_SAMPLE_INTERVAL);
  }
  debugSerial.println("Reading Sample done");

  float total[4];
  total[0] = 0;
  total[1] = 0;
  total[2] = 0;
  total[3] = 0;
  j = 0;
  for (i = READ_SAMPLE_DROP; i < READ_SAMPLE_TIMES - READ_SAMPLE_DROP; i++) {
    total[0] += buffer[i][0];
    total[1] += buffer[i][1];
    total[2] += buffer[i][2];
    total[3] += buffer[i][3];
    j++;
  }
  *humidity = total[0] / j;
  *temperature = total[1] / j;
  *pressure = total[2] / j;
  *altitude = total[3] / j;
  ccs811.setEnvironmentalData(*humidity,*temperature);
}



void readSampledData(uint16_t * eco2, uint16_t * tvoc)
{
  int i;
  int d;
  int j = 0;
  uint16_t buffer[READ_SAMPLE_TIMES][2];
  uint16_t v = 0;
  for (i = 0; i < READ_SAMPLE_TIMES; i++) {
    buffer[i][0] = 0;
    buffer[i][1] = 0;
  }
  debugSerial.println("Reading Sample");
  for (i = 0; i < READ_SAMPLE_TIMES; i++) {
    v = 0;
    while (!ccs811.dataAvailable()) {
      debugSerial.print(".");
      delay(100);
    }
    debugSerial.println(".");
    ccs811.readAlgorithmResults();
    //read eCO2
    v = ccs811.getCO2();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][0] != 0 && buffer[j][0] < v) j++;
    if (buffer[j][0] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][0] = buffer[k - 1][0];
    }
    buffer[j][0] = v;
    //readtVOC
    v = ccs811.getTVOC();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][1] != 0 && buffer[j][1] < v) j++;
    if (buffer[j][1] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][1] = buffer[k - 1][1];
    }
    buffer[j][1] = v;
    delay(READ_SAMPLE_INTERVAL);
  }
  debugSerial.println("Reading Sample done");

  uint16_t total[2];
  total[0] = 0;
  total[1] = 0;
  uint16_t result[2];
  j = 0;
  for (i = READ_SAMPLE_DROP; i < READ_SAMPLE_TIMES - READ_SAMPLE_DROP; i++) {
    total[0] += buffer[i][0];
    total[1] += buffer[i][1];
    j++;
  }
  *eco2 = total[0] / j;
  *tvoc = total[1] / j;
}

bool SendLoRaMessage()
{
  uint16_t eco2;
  uint16_t tvoc;
  const uint8_t size = 4;
  uint8_t port = 5;
  uint8_t data[size];
  float humidity;
  float temperature;
  float pressure;
  float altitude;

  adjustEnvironmentalData(&humidity,&temperature,&pressure,&altitude);
  debugSerial.print(" Humidity: ");
  debugSerial.print(humidity, 0);
  debugSerial.print(" Pressure: ");
  debugSerial.print(pressure, 0);
  debugSerial.print(" Altimeter: ");
  debugSerial.print(altitude, 0);
  debugSerial.print(" Temp: ");
  debugSerial.print(temperature, 2);

  debugSerial.println();


  readSampledData(&eco2, &tvoc);
  debugSerial.print("ECO2 : ");
  debugSerial.print(eco2);
  debugSerial.print("TVOC : ");
  debugSerial.println(tvoc);
  data[0] = (uint8_t)(eco2 >> 8);
  data[1] = (uint8_t)(eco2);
  data[2] = (uint8_t)(tvoc >> 8);
  data[3] = (uint8_t)(tvoc);
  return OrangeForRN2483.sendMessage(CONFIRMED_MESSAGE, data, size, port); // send unconfirmed message
}

void loop() {
  unsigned long start = millis();
  bool res = OrangeForRN2483.getJoinState();
  if (! res) {
    debugSerial.println("Join Request");
    res = joinNetwork();
  }
  if (res) {
    debugSerial.println("Join Success");
    OrangeForRN2483.enableAdr();

    debugSerial.println("Send Data");
    bool sent = SendLoRaMessage();
    if (sent) {
      debugSerial.println("Message sent");
    } else  {
      debugSerial.println("FAiled to send message");
    }


    unsigned long spent = (millis() - start);
    if (spent < WAIT_BETWEEN_MESSAGE) {
      debugSerial.print("We will wait : ");
      debugSerial.println(WAIT_BETWEEN_MESSAGE - spent);
      delay(WAIT_BETWEEN_MESSAGE - spent);
    }
  } else {
    debugSerial.println("Join Failed");
    delay(5000);
  }
  debugSerial.println("Program Finished");

}
