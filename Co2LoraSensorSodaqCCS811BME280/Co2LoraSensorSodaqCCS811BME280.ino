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

#define MASK_CO2          B00000001
#define MASK_TVOC         B00000010
#define MASK_VOLTAGE      B00000100
#define MASK_TEMPERATURE  B00001000
#define MASK_HUMIDITY     B00010000
#define MASK_PRESSURE     B00100000
#define MASK_ALTITUDE     B01000000


uint8_t provide=MASK_CO2 | MASK_TVOC | MASK_TEMPERATURE | MASK_HUMIDITY | MASK_PRESSURE | MASK_ALTITUDE;

#define         READ_SAMPLE_INTERVAL         50    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            32     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             3
#define         MAX_SAMPLE_DISTANCE             1
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
  debugSerial.println("Initialization of the CCS811");
  Wire.begin();
  while (!ccs811.begin()) {
    debugSerial.println("Failed to start CCS811 ! Please check your wiring.");
    delay(2000);
  }
  debugSerial.println("Initialization of the BME280");
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
  Sample * humidities = new Sample(READ_SAMPLE_TIMES);
  Sample * temperatures = new Sample(READ_SAMPLE_TIMES);
  Sample * pressures = new Sample(READ_SAMPLE_TIMES);
  Sample * altitudes = new Sample(READ_SAMPLE_TIMES);

  debugSerial.println("Reading Environmental Sample");
  *humidity = -1;
  *temperature = -1;
  *pressure = -1;
  *altitude = -1;
  while (((*humidity) == -1) || ((*temperature) == -1) || ((*pressure) == -1) || ((*altitude) == -1)) {
    humidities->init();
    temperatures->init();
    pressures->init();
    altitudes->init();
    for (i = 0; i < READ_SAMPLE_TIMES; i++) {
      humidities->add(bme280.readFloatHumidity());
      temperatures->add(bme280.readTempC());
      pressures->add(bme280.readFloatPressure());
      altitudes->add(bme280.readFloatAltitudeMeters());
      delay(READ_SAMPLE_INTERVAL);
    }
    *humidity = humidities->value(MAX_SAMPLE_DISTANCE);
    *temperature = temperatures->value(MAX_SAMPLE_DISTANCE);
    *pressure = pressures->value(MAX_SAMPLE_DISTANCE);
    *altitude = altitudes->value(5);
    debugSerial.println("Reading Environmental Sample iteration");
  }
  debugSerial.println("Reading Environmental Sample done");
  delete humidities;
  delete temperatures;
  delete pressures;
  delete altitudes;
  ccs811.setEnvironmentalData(*humidity, *temperature);
}



void readSampledData(uint16_t * eco2, uint16_t * tvoc)
{
  int i;
  int d;
  int j = 0;
  Sample * eco2s = new Sample(READ_SAMPLE_TIMES);
  Sample * tvocs = new Sample(READ_SAMPLE_TIMES);

  debugSerial.println("Reading Sample CO2/tVOC");
  float eco2f = -1;
  float tvocf = -1;
  while ((eco2f == -1) || (tvocf == -1)) {
    eco2s->init();
    tvocs->init();
    for (i = 0; i < READ_SAMPLE_TIMES; i++) {
      while (!ccs811.dataAvailable()) {
        debugSerial.print(".");
        delay(100);
      }
      debugSerial.println(".");
      ccs811.readAlgorithmResults();
      eco2s->add(ccs811.getCO2());
      tvocs->add(ccs811.getTVOC());
      delay(READ_SAMPLE_INTERVAL);
    }
    debugSerial.print("eCo2 : ");
    eco2f = eco2s->value(MAX_SAMPLE_DISTANCE);
    debugSerial.print("tVoc : ");
    tvocf = tvocs->value(25);
    debugSerial.println("Reading Sample iteration");
  }
  *eco2 = (uint16_t) eco2f;
  *tvoc = (uint16_t) tvocf;

  debugSerial.println("Reading Sample done");
  delete eco2s;
  delete tvocs;
}

bool SendLoRaMessage()
{
  uint16_t eco2;
  uint16_t tvoc;
  const uint8_t size = 13;
  uint8_t port = 5;
  uint8_t data[size];
  float humidity;
  float temperature;
  float pressure;
  float altitude;

  adjustEnvironmentalData(&humidity, &temperature, &pressure, &altitude);
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
  data[0]=provide;
  data[1] = (uint8_t)(eco2 >> 8);
  data[2] = (uint8_t)(eco2);
  data[3] = (uint8_t)(tvoc >> 8);
  data[4] = (uint8_t)(tvoc);
  data[5] = (uint8_t)(((uint16_t) temperature) >> 8);
  data[6] = (uint8_t)(temperature);
  data[7] = (uint8_t)(((uint16_t) (humidity)) >> 8);
  data[8] = (uint8_t)(humidity);
  data[9] = (uint8_t)(((uint16_t) (pressure/100)) >> 8);
  data[10] = (uint8_t)(pressure/100);
  data[11] = (uint8_t)(((uint16_t) altitude) >> 8);
  data[12] = (uint8_t)(altitude);
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
