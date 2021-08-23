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
/*#include <EEPROM.h>*/

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
float           ZERO_POINT_VOLTAGE  =  (3.3156/DC_GAIN); //define the output of the sensor in volts when the concentration of CO2 is 400PPM
#define         REACTION_VOLTGAE             (0.030) //define the voltage drop of the sensor when move the sensor from air into 1000ppm CO2
/*
  REF_VOLT-((log10(REF_CO2)-2.602)*(-0.075))))*8.5
  489 =3.31
  317 => 3.26
*/
/*****************************Globals***********************************************/
float           CO2Curve[3]  =  {2.602, ZERO_POINT_VOLTAGE, (REACTION_VOLTGAE / (2.602 - 3))};

#define debugSerial SerialUSB
#define LED_RED           13
#define LED_GREEN         12

#define MASK_CO2          B00000001
#define MASK_TVOC         B00000010
#define MASK_VOLTAGE      B00000100
#define MASK_TEMPERATURE  B00001000
#define MASK_HUMIDITY     B00010000
#define MASK_PRESSURE     B00100000
#define MASK_ALTITUDE     B01000000
#define MASK_OPTIONS      B10000000

#define MASK_OPTION_BASELINE    B00000001
#define MASK_OPTION_STD_CO2     B00000010
#define MASK_OPTION_CONFIG      B00000100
#define MASK_OPTION_ACK_CONFIG  B00001000

#define MASK_BASELINE     B00000001
#define MASK_THRESHOLD    B00000010

#define EEPROM_THRESHOLD 0
#define EEPROM_BASELINE  1

#define FORCE_RECONFIGURE_DELAY (1000*3600*6)

#define STARTUP_WARMUP_DELAY (1000*60*20)

// The following keys are for structure purpose only. You must define YOUR OWN.
const uint8_t appEUI[8] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
const uint8_t appKey[16] = {  0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 };

bool first = true;
uint16_t threshold = 800;
uint16_t baseline = 0;
bool ack_config=false;
unsigned long lastconfig = 0;

bool joinNetwork()
{
  OrangeForRN2483.setDataRate(DATA_RATE_1); // Set DataRate to SF11/125Khz
  return OrangeForRN2483.joinNetwork(appEUI, appKey);
}


/* ########################################################################## */
/* #######################      CONFIG           ############################ */

void setThreshold(uint16_t value) {
  threshold=value;
  /*EEPROM.write((EEPROM_THRESHOLD*2), (uint8_t)(value >> 8));
  uint8_t tmp=(uint8_t)(value);
  if (tmp==255) tmp--;
  EEPROM.write((EEPROM_THRESHOLD*2)+1, tmp); */
}


void setVoltage(uint16_t value) {
  ZERO_POINT_VOLTAGE=(((float) value)/1000)/DC_GAIN;
  CO2Curve[1]=ZERO_POINT_VOLTAGE;
  /*EEPROM.write((EEPROM_BASELINE*2), (uint8_t)(value >> 8));
  uint8_t tmp=(uint8_t)(value);
  if (tmp==255) tmp--;
  EEPROM.write((EEPROM_BASELINE*2)+1, tmp); */
}

void getThreshold() {
  /*uint16_t value1=EEPROM.read(EEPROM_THRESHOLD*2);
  uint16_t value2=EEPROM.read(EEPROM_THRESHOLD*2+1);
  if ((value1!=255) && (value2!=255)) {
    threshold=value1*256+value2;
  }*/
}


void getVoltage() {
  /*uint16_t value1=EEPROM.read(EEPROM_BASELINE*2);
  uint16_t value2=EEPROM.read(EEPROM_BASELINE*2+1);
  if ((value1!=255) && (value2!=255)) {
    ZERO_POINT_VOLTAGE=(((float) (value1*256+value2))/1000)/DC_GAIN;
    CO2Curve[1]=ZERO_POINT_VOLTAGE;
  }*/
}

/* ########################################################################## */
/* #######################      SETUP            ############################ */
void setup() {
  debugSerial.begin(57600);

  while ((!debugSerial) && (millis() < 10000)) ;
  OrangeForRN2483.init();
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  getVoltage();
  getThreshold();
  lastconfig = millis();

  /* Initialize baseline and threshold */
}


/* ########################################################################## */
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
  float eco2=-1;
  float volts=-1;
  uint8_t size = 5;
  uint8_t port = 5;
  uint8_t data[size];

  if (!first) {
    readSampledData(&eco2, &volts);
    debugSerial.print("ECO2 : ");
    debugSerial.print(eco2);
    debugSerial.print(" Volts : ");
    debugSerial.println(volts);
  }
  data[0] = 0;
  size = 1;
  if (eco2 != -1) {
    data[0] |= MASK_CO2;
    data[size] = (uint8_t)(((uint16_t) eco2) >> 8);
    data[size + 1] = (uint8_t)(eco2);
    size += 2;
    if (threshold > 0) {
      if (eco2 > threshold) {
        //turn on led red, off green
        digitalWrite(LED_RED, HIGH);
        digitalWrite(LED_GREEN, LOW);
      } else {
        //turn off led red, on green
        digitalWrite(LED_RED, LOW);
        digitalWrite(LED_GREEN, HIGH);
      }
    }
  }
  if (volts != -1) {
    data[0] |= MASK_VOLTAGE;
    data[size] = (uint8_t)(((uint16_t) (volts*1000)) >> 8);
    data[size + 1] = (uint8_t)(volts*1000);
    size += 2;
  }
  int option=0;
  if (first) {
    data[0] |= MASK_OPTIONS;
    option = size;
    size += 1;
    debugSerial.println("Request For Configuration");
    data[option] = MASK_OPTION_CONFIG;
  }
  if (ack_config) {
    if (option==0) {
      data[0] |= MASK_OPTIONS;
      option = size;
      data[option]=0;
      size += 1;
    }
    data[option] |= MASK_OPTION_ACK_CONFIG;
    debugSerial.println("Acknowledge Configuration");
    ack_config=false;
  }
  
  return OrangeForRN2483.sendMessage(CONFIRMED_MESSAGE, data, size, port); // send unconfirmed message
}

bool SendAckLoRaMessage() {
  uint8_t size = 1;
  uint8_t port = 5;
  uint8_t data[size];
  data[0]=0;
  return OrangeForRN2483.sendMessage(UNCONFIRMED_MESSAGE, data, size, port); // send unconfirmed message
}


/* ########################################################################## */
/* #######################       LOOP            ############################ */

void loop() {

  unsigned long start = millis();
  bool res=false;
  if ((start-lastconfig) > FORCE_RECONFIGURE_DELAY) {
    /*OrangeForRN2483.init();*/
    debugSerial.println("Force reconfigure");
    res = joinNetwork();
    lastconfig=millis();
  }
  
  res = OrangeForRN2483.getJoinState();
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
      delay(2000);
      //we can try to receive the response
      DownlinkMessage* downlinkMessage = OrangeForRN2483.getDownlinkMessage();
      debugSerial.print("Port :"); debugSerial.println(downlinkMessage->getPort());
      int8_t length = 0;
      uint8_t* response = (uint8_t*)downlinkMessage->getMessageByteArray(&length);
      debugSerial.print("Response length :"); debugSerial.println(length);
      if (length > 0) {
        lastconfig=millis();
        uint8_t indice = 1;
        if (((response[0] & MASK_BASELINE) == MASK_BASELINE) && (length >= indice + 2)) {
          ack_config=true;
          baseline = response[indice] * 256 + response[indice + 1];
          debugSerial.print("Reconfigure BaseLine :");debugSerial.println(baseline);
          if (baseline != 0) {
            setVoltage(baseline);
            debugSerial.print("ZERO_POINT_VOLTAGE=");debugSerial.println(ZERO_POINT_VOLTAGE);
          }
          indice += 2;
        }
        if (((response[0] & MASK_THRESHOLD) == MASK_THRESHOLD) && (length >= indice + 2)) {
          ack_config=true;
          setThreshold(response[indice] * 256 + response[indice + 1]);
          indice += 2;
        }
      SendAckLoRaMessage();
      }
    } else  {
      debugSerial.println("Failed to send message");
    }

    if (first) {
      if (!ack_config) {
        debugSerial.println("Wait 5s and check configuration");
        delay(5000);
      } else {
        first=false;
        debugSerial.println("We will wait 20 minutes for warmup");
        delay(STARTUP_WARMUP_DELAY);
        debugSerial.println("Warmup finished !!!");
      }
    } else {
      unsigned long spent = (millis() - start);
      if (spent < WAIT_BETWEEN_MESSAGE) {
        debugSerial.print("We will wait : ");
        debugSerial.println(WAIT_BETWEEN_MESSAGE - spent);
        delay(WAIT_BETWEEN_MESSAGE - spent);
      }
    }
  } else {
    debugSerial.println("Join Failed");
    delay(2000);
  }
  debugSerial.println("Program Finished");

}
