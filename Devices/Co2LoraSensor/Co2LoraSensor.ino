#include <ESP32_LoRaWAN.h>
#include "Arduino.h"
#include "Sample.h"
//#include "heltec.h"
#define debugSerial Serial

#define MASK_CO2          B00000001
#define MASK_TVOC         B00000010
#define MASK_VOLTAGE      B00000100
#define MASK_TEMPERATURE  B00001000
#define MASK_HUMIDITY     B00010000
#define MASK_PRESSURE     B00100000
#define MASK_ALTITUDE     B01000000

/************************Hardware Related Macros************************************/
#define       INPUT_VOLT                    (3.3 * 2)
#define       INPUT_RANGE                   (4095)
/************************Hardware Related Macros************************************/
#define         MG_PIN                       (36)     //define which analog input channel you are going to use
#define         BOOL_PIN                     (2)
#define         DC_GAIN                      (8.5)   //define the DC gain of amplifier

/***********************Software Related Macros************************************/
#define         READ_SAMPLE_INTERVAL         (50)    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            (30)     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             (3)
#define         MAX_READ_SAMPLE_RETRY         (10)
#define         MAX_SAMPLE_DISTANCE           (5)

/**********************Application Related Macros**********************************/
//These two values differ from sensor to sensor. user should derermine this value.
float         ZERO_POINT_VOLTAGE     =      (1.825 / DC_GAIN); //define the output of the sensor in volts when the concentration of CO2 is 400PPM
#define         REACTION_VOLTGAE             (0.030) //define the voltage drop of the sensor when move the sensor from air into 1000ppm CO2
/*
  REF_VOLT-((log10(REF_CO2)-2.602)*(-0.075))))*8.5
  489 => 1.825
  1266 => 1.77
*/


/***********************************************************************************/
#define LED_RED           13
#define LED_GREEN         12

#define LED_MODE_OFF   0
#define LED_MODE_GREEN 1
#define LED_MODE_RED   2

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

#define FORCE_RECONFIGURE_DELAY (1000*3600*6)
#define STARTUP_WARMUP_DELAY (1000*60*20)

bool first = true;
bool new_threshold = true;
int led = LED_MODE_OFF;
bool ack_config=false;
unsigned long lastconfig = 0;

uint16_t threshold = 800;
uint16_t baseline = 0;

/*****************************Globals***********************************************/
float           CO2Curve[3]  =  {2.602, ZERO_POINT_VOLTAGE, (REACTION_VOLTGAE / (2.602 - 3))};

/*license for Heltec ESP32 LoRaWan, quary your ChipID relevant license: http://resource.heltec.cn/search */
//uint32_t  license[4] = {0x00000000,0x00000000,0x00000000,0x00000000};
uint32_t  license[4] = {0xE4924D73, 0x9E9BE372, 0x47D21024, 0xB715FA7C};

/* OTAA para*/
uint8_t DevEui[] = { 0x22, 0x32, 0x33, 0x00, 0x00, 0x88, 0x88, 0x02 }; //2232330000888802
uint8_t AppEui[] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
uint8_t AppKey[] = { 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 }; // 88888888888888888888888888886601

/* ABP para*/
uint8_t NwkSKey[] = { 0x15, 0xb1, 0xd0, 0xef, 0xa4, 0x63, 0xdf, 0xbe, 0x3d, 0x11, 0x18, 0x1e, 0x1e, 0xc7, 0xda, 0x85 };
uint8_t AppSKey[] = { 0xd7, 0x2c, 0x78, 0x75, 0x8c, 0xdc, 0xca, 0xbf, 0x55, 0xee, 0x4a, 0x77, 0x8d, 0x16, 0xef, 0x67 };
uint32_t DevAddr =  ( uint32_t )0x007e6ae1;

/*LoraWan channelsmask, default channels 0-7*/
uint16_t userChannelsMask[6] = { 0x00FF, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000 };

/*LoraWan Class, Class A and Class C are supported*/
DeviceClass_t  loraWanClass = CLASS_C;

/*the application data transmission duty cycle.  value in [ms].*/
/*uint32_t appTxDutyCycle = 120000;*/
uint32_t appTxDutyCycle = 600000;

/*OTAA or ABP*/
bool overTheAirActivation = true;

/*ADR enable*/
bool loraWanAdr = true;

/* Indicates if the node is sending confirmed or unconfirmed messages */
bool isTxConfirmed = true;

/* Application port */
uint8_t appPort = 2;


/*!
  Number of trials to transmit the frame, if the LoRaMAC layer did not
  receive an acknowledgment. The MAC performs a datarate adaptation,
  according to the LoRaWAN Specification V1.0.2, chapter 18.4, according
  to the following table:

  Transmission nb | Data Rate
  ----------------|-----------
  1 (first)       | DR
  2               | DR
  3               | max(DR-1,0)
  4               | max(DR-1,0)
  5               | max(DR-2,0)
  6               | max(DR-2,0)
  7               | max(DR-3,0)
  8               | max(DR-3,0)

  Note, that if NbTrials is set to 1 or 2, the MAC will not decrease
  the datarate, in case the LoRaMAC layer did not receive an acknowledgment
*/
uint8_t confirmedNbTrials = 4;

/*LoraWan debug level, select in arduino IDE tools.
  None : print basic info.
  Freq : print Tx and Rx freq, DR info.
  Freq && DIO : print Tx and Rx freq, DR, DIO0 interrupt and DIO1 interrupt info.
  Freq && DIO && PW: print Tx and Rx freq, DR, DIO0 interrupt, DIO1 interrupt, MCU sleep and MCU wake info.
*/
uint8_t debugLevel = LoRaWAN_DEBUG_LEVEL;

/*LoraWan region, select in arduino IDE tools*/
LoRaMacRegion_t loraWanRegion = ACTIVE_REGION;

uint32_t count = 0;
uint16_t percentage;
bool ack_config=false;

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
  if (raw != -1) {
    *volt = (raw * INPUT_VOLT / INPUT_RANGE);
    *co2 = MGGetPercentage(*volt, CO2Curve);
  }
  debugSerial.println("Reading Sample done");
  delete raws;
}

void __attribute__((weak)) downLinkDataHandle(McpsIndication_t *mcpsIndication)
{
  debugSerial.println("*********************************************************");
  lora_printf("+REV DATA:%s,RXSIZE %d,PORT %d\r\n", mcpsIndication->RxSlot ? "RXWIN2" : "RXWIN1", mcpsIndication->BufferSize, mcpsIndication->Port);
  lora_printf("+REV DATA:");

  for (uint8_t i = 0; i < mcpsIndication->BufferSize; i++)
  {
    lora_printf("%02X", mcpsIndication->Buffer[i]);
  }
  lora_printf("\r\n");
  int8_t length = mcpsIndication->BufferSize;
  if (length > 0) {
    uint8_t indice = 1;
    if (((mcpsIndication->Buffer[0] & MASK_BASELINE) == MASK_BASELINE) && (length >= indice + 2)) {
      ack_config=true;
      baseline = mcpsIndication->Buffer[indice] * 256 + mcpsIndication->Buffer[indice + 1];
      debugSerial.print("Receive BaseLine :"); debugSerial.println(baseline);
      if (baseline != 0) {
        debugSerial.print("Reconfigure BaseLine :"); debugSerial.println(baseline);
        ZERO_POINT_VOLTAGE = (((float) baseline) / 1000) / DC_GAIN;
        CO2Curve[1]=ZERO_POINT_VOLTAGE;
      }
      indice += 2;
    }
    if (((mcpsIndication->Buffer[0] & MASK_THRESHOLD) == MASK_THRESHOLD) && (length >= indice + 2)) {
      ack_config=true;
      threshold = mcpsIndication->Buffer[indice] * 256 + mcpsIndication->Buffer[indice + 1];
      debugSerial.print("Reconfigure Threshold :"); debugSerial.println(threshold);
      indice += 2;
    }
  }
}

static void prepareTxFrame( uint8_t port )
{

  float eco2=-1;
  float volts=-1;

  if (millis()<STARTUP_WARMUP_DELAY ) {
    readSampledData(&eco2, &volts);
    debugSerial.print("ECO2 : ");
    debugSerial.print(eco2);
    debugSerial.print(" Volts : ");
    debugSerial.println(volts);
    percentage = (uint16_t) (eco2);
  }
  appData[0] = 0;
  appDataSize = 1;
  if (eco2 != -1) {
    appData[0] |= MASK_CO2;
    appData[appDataSize] = (uint8_t)(((uint16_t) eco2) >> 8);
    appData[appDataSize + 1] = (uint8_t)(eco2);
    appDataSize += 2;
    if (threshold > 0) {
      if (eco2 > threshold) {
        led = LED_MODE_RED;
        digitalWrite(LED_GREEN, LOW);
        digitalWrite(LED_RED, HIGH);
      } else {
        led = LED_MODE_GREEN;
        digitalWrite(LED_RED, LOW);
        digitalWrite(LED_GREEN, HIGH);
      }
    } else {
      led = LED_MODE_OFF;
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_RED, LOW);
    }
  }
  if (volts != -1) {
    appData[0] |= MASK_VOLTAGE;
    appData[appDataSize] = (uint8_t)(((uint16_t) (volts * 1000)) >> 8);
    appData[appDataSize + 1] = (uint8_t)(volts * 1000);
    appDataSize += 2;
  }
  int option=0;
  if (first) {
    appData[0] |= MASK_OPTIONS;
    option = appDataSize;
    appDataSize += 1;
    first = false;
    debugSerial.println("Request For Configuration");
    appData[option] = MASK_OPTION_CONFIG;
  }
  if (ack_config) {
    if (option==0) {
      appData[0] |= MASK_OPTIONS;
      option = appDataSize;
      appData[option]=0;
      appDataSize += 1;
    }
    appData[option] |= MASK_OPTION_ACK_CONFIG;
    debugSerial.println("Acknowledge Configuration");
    ack_config=false;
  }


}


// Add your initialization code here
void setup()
{
  //Heltec.begin(true /*DisplayEnable Enable*/, true /*LoRa Disable*/, true /*Serial Enable*/);
  //Heltec.display->flipScreenVertically();
  //Heltec.display->setFont(ArialMT_Plain_10);
  if (mcuStarted == 0)
  {
    LoRaWAN.displayMcuInit();
    
  }
  Serial.begin(115200);
  while (!Serial);
  SPI.begin(SCK, MISO, MOSI, SS);
  Mcu.init(SS, RST_LoRa, DIO0, DIO1, license);
  deviceState = DEVICE_STATE_INIT;
  Serial.println("Initialization of the LED - 2");
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, HIGH);
  lastconfig = millis();
}

// The loop function is called in an endless loop
void loop()
{
  switch ( deviceState )
  {
    case DEVICE_STATE_INIT:
      {
        Serial.println("DEVICE_STATE_INIT");
#if(LORAWAN_DEVEUI_AUTO)
        LoRaWAN.generateDeveuiByChipID();
#endif
        LoRaWAN.init(loraWanClass, loraWanRegion);
        break;
      }
    case DEVICE_STATE_JOIN:
      {
        Serial.println("DEVICE_STATE_JOIN");
        LoRaWAN.displayJoining();
        LoRaWAN.join();
        break;
      }
    case DEVICE_STATE_SEND:
      {
        Serial.println("DEVICE_STATE_SEND");
        LoRaWAN.displaySending();
        prepareTxFrame( appPort );
        LoRaWAN.send(loraWanClass);
        deviceState = DEVICE_STATE_CYCLE;
        break;
      }
    case DEVICE_STATE_CYCLE:
      {
        Serial.println("DEVICE_STATE_CYCLE");
        // Schedule next packet transmission
        txDutyCycleTime = appTxDutyCycle + randr( -APP_TX_DUTYCYCLE_RND, APP_TX_DUTYCYCLE_RND );
        LoRaWAN.cycle(txDutyCycleTime);
        deviceState = DEVICE_STATE_SLEEP;
        count = 0;
        break;
      }
    case DEVICE_STATE_SLEEP:
      {
        LoRaWAN.displayAck();
        String text = "CO2: ";
        text.concat(percentage);
        text.concat(" ppm");
        displayPPM();
        /*Heltec.display->drawString(0, 42, text.c_str());
          Heltec.display->display();*/
        //Serial.println(text.c_str());
        LoRaWAN.sleep(loraWanClass, debugLevel);
        //Radio.IrqProcess( );
        //sleep(100);
        /*Serial.print(".");
          count++;
          if (count>180) {
          Serial.println("");
          count=0;
          }*/


        break;
      }
    default:
      {
        Serial.println("default");
        deviceState = DEVICE_STATE_INIT;
        break;
      }
  }
}

void displayPPM() {
  /* if (digitalRead(Vext)==HIGH) {
     digitalWrite(Vext,LOW);
    delay(20);
     Display.init();
     delay(50);
     Display.wakeup();
    }*/
  String text = "CO2: ";
  text.concat(percentage);
  text.concat(" ppm");
  //digitalWrite(Vext,LOW);
  //delay(50);
  //Display.init();
  //Display.wakeup();
  Display.clear();
  Display.setFont(ArialMT_Plain_16);
  Display.setTextAlignment(TEXT_ALIGN_CENTER);
  Display.clear();
  Display.drawString(64, 22, text.c_str());
  Display.display();

}

/*****************************  MGRead *********************************************
  Input:   mg_pin - analog channel
  Output:  output of SEN-000007
  Remarks: This function reads the output of SEN-000007
************************************************************************************/

float MGRead(int mg_pin)
{
  int i;
  int d;
  int j = 0;
  float buffer[READ_SAMPLE_TIMES];
  float v = 0;
  for (i = 0; i < READ_SAMPLE_TIMES; i++) buffer[i] = 0;
  for (i = 0; i < READ_SAMPLE_TIMES; i++) {
    v = 0;
    while (v == 0) v = analogRead(mg_pin);
    delay(READ_SAMPLE_INTERVAL);
    j = 0;
    while (j < READ_SAMPLE_TIMES && buffer[j] != 0 && buffer[j] < v) j++;
    if (buffer[j] != 0) {
      int k = 0;
      for (k = READ_SAMPLE_TIMES - 1; k > j; k--) buffer[k] = buffer[k - 1];
    }
    buffer[j] = v;
  }

  float total = 0;
  j = 0;
  for (i = READ_SAMPLE_DROP; i < READ_SAMPLE_TIMES - READ_SAMPLE_DROP; i++) {
    total += buffer[i];
    j++;
  }
  v = (total / j);
  return v * INPUT_VOLT / INPUT_RANGE;
}
/*****************************  MQGetPercentage **********************************
  Input:   volts   - SEN-000007 output measured in volts
         pcurve  - pointer to the curve of the target gas
  Output:  ppm of the target gas
  Remarks: By using the slope and a point of the line. The x(logarithmic value of ppm)
         of the line could be derived if y(MG-811 output) is provided. As it is a
         logarithmic coordinate, power of 10 is used to convert the result to non-logarithmic
         value.
************************************************************************************/
int  MGGetPercentage(float volts, float *pcurve)
{
  return pow(10, ((volts / DC_GAIN) - pcurve[1]) / pcurve[2] + pcurve[0]);
}
