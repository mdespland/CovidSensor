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
#include "Arduino.h"
#include "Sample.h"

/************************Hardware Related Macros************************************/
#define       INPUT_VOLT                    (6.6)
#define       INPUT_RANGE                   (1023)
/************************Hardware Related Macros************************************/
#define         MG_PIN                       (A0)     //define which analog input channel you are going to use
#define         BOOL_PIN                     (2)
#define         DC_GAIN                      (8.5)   //define the DC gain of amplifier


#define         READ_SAMPLE_INTERVAL         50    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            32     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             3
#define         MAX_SAMPLE_DISTANCE             5
#define         MAX_READ_SAMPLE_RETRY             10
#define         WAIT_BETWEEN_MESSAGE         600000

/**********************Application Related Macros**********************************/
//These two values differ from sensor to sensor. user should derermine this value.
#define         ZERO_POINT_VOLTAGE           (3.3156/DC_GAIN) //define the output of the sensor in volts when the concentration of CO2 is 400PPM
#define         REACTION_VOLTGAE             (0.030) //define the voltage drop of the sensor when move the sensor from air into 1000ppm CO2
/*
  REF_VOLT-((log10(REF_CO2)-2.602)*(-0.075))))*8.5
  489 =3.31
  317 => 3.26
*/
/*****************************Globals***********************************************/
float           CO2Curve[3]  =  {2.602, ZERO_POINT_VOLTAGE, (REACTION_VOLTGAE / (2.602 - 3))};

#define debugSerial SerialUSB

#define MASK_CO2          B00000001
#define MASK_TVOC         B00000010
#define MASK_VOLTAGE      B00000100
#define MASK_TEMPERATURE  B00001000
#define MASK_HUMIDITY     B00010000
#define MASK_PRESSURE     B00100000
#define MASK_ALTITUDE     B01000000

// The following keys are for structure purpose only. You must define YOUR OWN.
const uint8_t appEUI[8] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
const uint8_t appKey[16] = {  0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 };

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

}

int  MGGetPercentage(float volts, float *pcurve)
{
  return pow(10, ((volts / DC_GAIN) - pcurve[1]) / pcurve[2] + pcurve[0]);
}

/* pow(10, ((volts-ZERO)/8.5)/-0.075)+2.602)
  REF_VOLT-((log10(REF_CO2)-2.602)*(-0.075))))*8.5
  489 =3.31
  317 => 3.26
*/

void readSampledData(float * co2, float * volt)
{
  int i;
  Sample * raws = new Sample(READ_SAMPLE_TIMES);
  debugSerial.println("Reading Sample");
  int retry = 0;
  float raw = -1;
  *co2 = -1;
  *volt = -1;
  while ((raw == -1) && (retry < MAX_READ_SAMPLE_RETRY)) {
    raws->init();
    for (i = 0; i < READ_SAMPLE_TIMES; i++) {
      raws->add(analogRead(MG_PIN));
      delay(READ_SAMPLE_INTERVAL);
    }
    debugSerial.print("Raw : ");
    raw = raws->value(MAX_SAMPLE_DISTANCE);
    debugSerial.println("Reading Sample iteration");
    retry++;
  }
  if (raw!=-1) {
    *volt = (raw * INPUT_VOLT / INPUT_RANGE);
    *co2=MGGetPercentage(*volt, CO2Curve);
  }
  debugSerial.println("Reading Sample done");
  delete raws;
}


bool SendLoRaMessage()
{
  float eco2;
  float volts;
  uint8_t size = 5;
  uint8_t port = 5;
  uint8_t data[size];


  readSampledData(&eco2, &volts);
  debugSerial.print("ECO2 : ");
  debugSerial.print(eco2);
  debugSerial.print(" Volts : ");
  debugSerial.println(volts);

  data[0] = 0;
  size = 1;
  if (eco2 != -1) {
    data[0] |= MASK_CO2;
    data[size] = (uint8_t)(((uint16_t) eco2) >> 8);
    data[size + 1] = (uint8_t)(eco2);
    size += 2;
  }
  if (volts != -1) {
    data[0] |= MASK_VOLTAGE;
    data[size] = (uint8_t)(((uint16_t) (volts*1000)) >> 8);
    data[size + 1] = (uint8_t)(volts*1000);
    size += 2;
  }
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
      debugSerial.println("Failed to send message");
    }


    unsigned long spent = (millis() - start);
    if (spent < WAIT_BETWEEN_MESSAGE) {
      debugSerial.print("We will wait : ");
      debugSerial.println(WAIT_BETWEEN_MESSAGE - spent);
      delay(WAIT_BETWEEN_MESSAGE - spent);
    }
  } else {
    debugSerial.println("Join Failed");
    delay(2000);
  }
  debugSerial.println("Program Finished");

}
