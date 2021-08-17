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
#include "Sample.h"
//#define CCS811_ADDR 0x5B //Default I2C Address
#define CCS811_ADDR 0x5A //Alternate I2C Address
#define BME280_ADDR 0x76

#define LED_WARNING_RED           13
#define LED_WARNING_GREEN         12

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

#define MAX_MESSAGE_SIZE (1+2*7+1+2*2)

uint8_t provide = MASK_CO2 | MASK_TVOC | MASK_TEMPERATURE | MASK_HUMIDITY | MASK_PRESSURE | MASK_ALTITUDE;

#define         READ_SAMPLE_INTERVAL         50    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            32     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             3
#define         MAX_SAMPLE_DISTANCE             5
#define         MAX_READ_SAMPLE_RETRY           10
#define         WAIT_BETWEEN_MESSAGE         600000

#define LED_MODE_OFF   0
#define LED_MODE_GREEN 1
#define LED_MODE_RED   2

#define debugSerial SerialUSB

// The following keys are for structure purpose only. You must define YOUR OWN.
const uint8_t appEUI[8] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
const uint8_t appKey[16] = {  0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 };
CCS811 ccs811(CCS811_ADDR);
BME280 bme280;

uint32_t rxdelay2 = 0;

bool first = true;
bool new_threshold = true;
bool ack_config=false;

int led = LED_MODE_OFF;

uint16_t threshold = 800;
uint16_t baseline = 0;

bool joinNetwork()
{
  OrangeForRN2483.setDataRate(DATA_RATE_1); // Set DataRate to SF11/125Khz
  return OrangeForRN2483.joinNetwork(appEUI, appKey);
}

void setup() {

  debugSerial.begin(115200);

  while ((!debugSerial) && (millis() < 10000)) ;

  OrangeForRN2483.init();
  OrangeForRN2483.enableAdr(false);
  rxdelay2 = OrangeForRN2483.getRxdelay2();
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
  if (baseline != 0) {
    ccs811.setBaseline(baseline);
  }
  debugSerial.println("Initialization of the LED");
  pinMode(LED_WARNING_GREEN, OUTPUT);
  pinMode(LED_WARNING_RED, OUTPUT);
  digitalWrite(LED_WARNING_GREEN, LOW);
  digitalWrite(LED_WARNING_RED, LOW);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
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
  *humidity = NULL_SAMPLE_VALUE;
  *temperature = NULL_SAMPLE_VALUE;
  *pressure = NULL_SAMPLE_VALUE;
  *altitude = NULL_SAMPLE_VALUE;
  int retry = 0;
  while ((((*humidity) == NULL_SAMPLE_VALUE) || ((*temperature) == NULL_SAMPLE_VALUE) || ((*pressure) == NULL_SAMPLE_VALUE) || ((*altitude) == NULL_SAMPLE_VALUE))  && (retry < MAX_READ_SAMPLE_RETRY)) {
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
    float median = humidities->value(MAX_SAMPLE_DISTANCE);
    *humidity = median == NULL_SAMPLE_VALUE ? *humidity : median;
    median = temperatures->value(MAX_SAMPLE_DISTANCE);
    *temperature = median == NULL_SAMPLE_VALUE ? *temperature : median;
    median = pressures->value(MAX_SAMPLE_DISTANCE);
    *pressure = median == NULL_SAMPLE_VALUE ? *pressure : median;
    median = altitudes->value(5);
    *altitude = median == NULL_SAMPLE_VALUE ? *altitude : median;
    debugSerial.println("Reading Environmental Sample iteration");
    retry++;
  }
  debugSerial.println("Reading Environmental Sample done");
  delete humidities;
  delete temperatures;
  delete pressures;
  delete altitudes;
  if ((*humidity != NULL_SAMPLE_VALUE) && (*temperature != NULL_SAMPLE_VALUE)) {
    debugSerial.print("Baseline before setEnvironmentalData : "); debugSerial.println(ccs811.getBaseline());
    ccs811.setEnvironmentalData(*humidity, *temperature);
    debugSerial.print("Baseline after setEnvironmentalData : "); debugSerial.println(ccs811.getBaseline());
  }
}



void readSampledData(float * eco2, float * tvoc, float * humidity, float * temperature, float * pressure, float * altitude)
{
  int i;
  int d;
  int j = 0;
  Sample * eco2s = new Sample(READ_SAMPLE_TIMES);
  Sample * tvocs = new Sample(READ_SAMPLE_TIMES);

  debugSerial.println("Reading Sample CO2/tVOC");
  *eco2 = NULL_SAMPLE_VALUE;
  *tvoc = NULL_SAMPLE_VALUE;
  int retry = 0;
  while (((*eco2 == NULL_SAMPLE_VALUE) || (*tvoc == NULL_SAMPLE_VALUE)) && (retry < MAX_READ_SAMPLE_RETRY)) {
    adjustEnvironmentalData(humidity, temperature, pressure, altitude);
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
    float median = eco2s->value(MAX_SAMPLE_DISTANCE);
    *eco2 = median == NULL_SAMPLE_VALUE ? *eco2 : median;
    debugSerial.print("tVoc : ");
    median = tvocs->value(25);
    *tvoc = median == NULL_SAMPLE_VALUE ? *tvoc : median;
    debugSerial.println("Reading Sample iteration");
    retry++;
  }
  debugSerial.println("Reading Sample done");
  delete eco2s;
  delete tvocs;
}

bool SendLoRaMessage()
{
  float eco2;
  float tvoc;
  uint8_t size = MAX_MESSAGE_SIZE;
  uint8_t port = 5;
  uint8_t data[size];
  float humidity;
  float temperature;
  float pressure;
  float altitude;

  readSampledData(&eco2, &tvoc, &humidity, &temperature, &pressure, &altitude);
  debugSerial.print(" Humidity: ");
  debugSerial.print(humidity, 0);
  debugSerial.print(" Pressure: ");
  debugSerial.print(pressure, 0);
  debugSerial.print(" Altimeter: ");
  debugSerial.print(altitude, 0);
  debugSerial.print(" Temp: ");
  debugSerial.print(temperature, 2);

  debugSerial.println();
  debugSerial.print("ECO2 : ");
  debugSerial.print(eco2);
  debugSerial.print("TVOC : ");
  debugSerial.println(tvoc);
  data[0] = 0;
  size = 1; //MASK_CO2 | MASK_TVOC | MASK_TEMPERATURE | MASK_HUMIDITY | MASK_PRESSURE | MASK_ALTITUDE
  if (eco2 != NULL_SAMPLE_VALUE) {
    data[0] |= MASK_CO2;
    data[size] = (uint8_t)(((uint16_t) eco2) >> 8);
    data[size + 1] = (uint8_t)(eco2);
    size += 2;
    if (threshold > 0) {
      if (eco2 > threshold) {
        led = LED_MODE_RED;

      } else {
        led = LED_MODE_GREEN;
      }
    } else {
      led = LED_MODE_OFF;
    }
  }
  if (tvoc != NULL_SAMPLE_VALUE) {
    data[0] |= MASK_TVOC;
    data[size] = (uint8_t)(((uint16_t) tvoc) >> 8);
    data[size + 1] = (uint8_t)(tvoc);
    size += 2;
  }
  if (temperature != NULL_SAMPLE_VALUE) {
    data[0] |= MASK_TEMPERATURE;
    data[size] = (uint8_t)(((uint16_t) temperature) >> 8);
    data[size + 1] = (uint8_t)(temperature);
    size += 2;
  }
  if (humidity != NULL_SAMPLE_VALUE) {
    data[0] |= MASK_HUMIDITY;
    data[size] = (uint8_t)(((uint16_t) humidity) >> 8);
    data[size + 1] = (uint8_t)(humidity);
    size += 2;
  }
  if (pressure != NULL_SAMPLE_VALUE) {
    data[0] |= MASK_PRESSURE;
    data[size] = (uint8_t)(((uint16_t) (pressure / 100)) >> 8);
    data[size + 1] = (uint8_t)(pressure / 100);
    size += 2;
  }
  if (altitude != NULL_SAMPLE_VALUE) {
    data[0] |= MASK_ALTITUDE;
    data[size] = (uint8_t)(((uint16_t) altitude) >> 8);
    data[size + 1] = (uint8_t)(altitude);
    size += 2;
  }
  data[0] |= MASK_OPTIONS;
  int option = size;
  size += 1;
  data[option] = MASK_OPTION_BASELINE;
  uint16_t baseline = ccs811.getBaseline();
  debugSerial.print("Baseline : ");
  debugSerial.println(baseline);
  data[size] = (uint8_t)(baseline >> 8);
  data[size + 1] = (uint8_t)(baseline);
  size += 2;
  if (first) {
    first = false;
    debugSerial.println("Request For Configuration");
    data[option] |= MASK_OPTION_CONFIG;
  }
  if (ack_config) {
    ack_config=false;
    debugSerial.println("Acknowledge Configuration");
    data[option] |= MASK_OPTION_ACK_CONFIG;
  }
  return OrangeForRN2483.sendMessage(CONFIRMED_MESSAGE, data, size, port); // send unconfirmed message
}

void loop() {
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_BLUE, LOW);
  unsigned long start = millis();
  bool res = OrangeForRN2483.getJoinState();
  if (! res) {
    debugSerial.println("######## JOIN REQUEST ########");
    res = joinNetwork();
    OrangeForRN2483.enableAdr();
  }
  if (res) {
    debugSerial.println("Join Success");


    debugSerial.println("######## UPLINK MESSAGE ########");
    debugSerial.println("Send Data");
    bool sent = SendLoRaMessage();
    if (sent) {
      debugSerial.println("Message sent");

      /* ##################################### */
      //we can try to receive the response
      /*debugSerial.print("Wait RX Delay 2 : "); debugSerial.println( (uint32_t) (rxdelay2 * 1.1));
        delay((uint32_t) (rxdelay2 * 1.1));*/
      DownlinkMessage* downlinkMessage = OrangeForRN2483.getDownlinkMessage();
      debugSerial.println("######## DOWNLINK MESSAGE ########");
      debugSerial.print("Port :"); debugSerial.println(downlinkMessage->getPort());
      int8_t length = 0;
      uint8_t* response = (uint8_t*)downlinkMessage->getMessageByteArray(&length);
      debugSerial.print("Response length :"); debugSerial.println(length);
      if (length > 0) {
        digitalWrite(LED_RED, LOW);
        uint8_t indice = 1;
        if (((response[0] & MASK_BASELINE) == MASK_BASELINE) && (length >= indice + 2)) {
          ack_config=true;
          baseline = response[indice] * 256 + response[indice + 1];
          debugSerial.print("Receive BaseLine :"); debugSerial.println(baseline);
          if (baseline != 0) {
            debugSerial.print("Reconfigure BaseLine :"); debugSerial.println(baseline);
            CCS811::CCS811_Status_e status = ccs811.setBaseline(baseline);
            if (status != CCS811::CCS811_Stat_SUCCESS) {
              debugSerial.print("!!! Failed to reconfigure BaseLine : "); debugSerial.println(status);
            }
          }
          indice += 2;
        }
        if (((response[0] & MASK_THRESHOLD) == MASK_THRESHOLD) && (length >= indice + 2)) {
          ack_config=true;
          digitalWrite(LED_GREEN, LOW);
          threshold = response[indice] * 256 + response[indice + 1];
          debugSerial.print("Reconfigure Threshold :"); debugSerial.println(threshold);
          digitalWrite(LED_WARNING_RED, LOW);
          digitalWrite(LED_WARNING_GREEN, HIGH);
          delay(200);
          digitalWrite(LED_WARNING_GREEN, LOW);
          delay(200);
          digitalWrite(LED_WARNING_GREEN, HIGH);
          delay(200);
          digitalWrite(LED_WARNING_GREEN, LOW);
          delay(200);
          digitalWrite(LED_WARNING_GREEN, HIGH);
          debugSerial.println("Led have blink");
          indice += 2;
        }
      }
      /* #####################################*/
    } else  {
      debugSerial.println("Failed to send message");
    }
    if (led == LED_MODE_GREEN) {
      debugSerial.println("Switch to LED GREEN");
      digitalWrite(LED_WARNING_RED, LOW);
      digitalWrite(LED_WARNING_GREEN, HIGH);

    } else {
      if (led == LED_MODE_RED) {
        debugSerial.println("Switch to LED RED");
        digitalWrite(LED_WARNING_GREEN, LOW);
        digitalWrite(LED_WARNING_RED, HIGH);
      } else {
        debugSerial.println("Switch to LED OFF");
        digitalWrite(LED_WARNING_GREEN, LOW);
        digitalWrite(LED_WARNING_RED, LOW);
      }
    }
    digitalWrite(LED_BLUE, HIGH);
    unsigned long spent = (millis() - start);
    debugSerial.println("######## END OF LOOP ########");
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
