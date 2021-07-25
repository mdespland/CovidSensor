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

//#define CCS811_ADDR 0x5B //Default I2C Address
#define CCS811_ADDR 0x5A //Alternate I2C Address



#define         READ_SAMPLE_INTERVAL         50    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            30     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             3
#define         WAIT_BETWEEN_MESSAGE         600000     


#define debugSerial SerialUSB

// The following keys are for structure purpose only. You must define YOUR OWN.
const uint8_t appEUI[8] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
const uint8_t appKey[16] = {  0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 };
CCS811 mySensor(CCS811_ADDR);

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
  Serial.println("Initialization of the CCS");
  Wire.begin();
  while (!mySensor.begin()) {
    Serial.println("Failed to start sensor! Please check your wiring.");
    delay(2000);
  }

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
    while (!mySensor.dataAvailable()) {
      debugSerial.print(".");
      delay(100);
    }
    debugSerial.println(".");
    mySensor.readAlgorithmResults();
    //read eCO2
    v = mySensor.getCO2();
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j][0] != 0 && buffer[j][0] < v) j++;
    if (buffer[j][0] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k][0] = buffer[k - 1][0];
    }
    buffer[j][0] = v;
    //readtVOC
    v = mySensor.getTVOC();
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
  } else debugSerial.println("Join Failed");
  debugSerial.println("Program Finished");

}
