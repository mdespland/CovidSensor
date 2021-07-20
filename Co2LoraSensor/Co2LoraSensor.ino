#include <ESP32_LoRaWAN.h>
#include "Arduino.h"
//#include "heltec.h"

/************************Hardware Related Macros************************************/
#define       INPUT_VOLT                    (3.3)
#define       INPUT_RANGE                   (4095)
/************************Hardware Related Macros************************************/
#define         MG_PIN                       (36)     //define which analog input channel you are going to use
#define         BOOL_PIN                     (2)
#define         DC_GAIN                      (8.5)   //define the DC gain of amplifier

/***********************Software Related Macros************************************/
#define         READ_SAMPLE_INTERVAL         (50)    //define how many samples you are going to take in normal operation
#define         READ_SAMPLE_TIMES            (30)     //define the time interval(in milisecond) between each samples in normal operation
#define         READ_SAMPLE_DROP             (3) 

/**********************Application Related Macros**********************************/
//These two values differ from sensor to sensor. user should derermine this value.
#define         ZERO_POINT_VOLTAGE           (2.1/DC_GAIN) //define the output of the sensor in volts when the concentration of CO2 is 400PPM
#define         REACTION_VOLTGAE             (0.030) //define the voltage drop of the sensor when move the sensor from air into 1000ppm CO2

/*****************************Globals***********************************************/
float           CO2Curve[3]  =  {2.602,ZERO_POINT_VOLTAGE,(REACTION_VOLTGAE/(2.602-3))};

/*license for Heltec ESP32 LoRaWan, quary your ChipID relevant license: http://resource.heltec.cn/search */
//uint32_t  license[4] = {0x00000000,0x00000000,0x00000000,0x00000000};
uint32_t  license[4] = {0xE4924D73,0x9E9BE372,0x47D21024,0xB715FA7C};

/* OTAA para*/
uint8_t DevEui[] = { 0x22, 0x32, 0x33, 0x00, 0x00, 0x88, 0x88, 0x02 }; //2232330000888802
uint8_t AppEui[] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x02, 0xB1, 0x8A };
uint8_t AppKey[] = { 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x66, 0x01 }; // 88888888888888888888888888886601

/* ABP para*/
uint8_t NwkSKey[] = { 0x15, 0xb1, 0xd0, 0xef, 0xa4, 0x63, 0xdf, 0xbe, 0x3d, 0x11, 0x18, 0x1e, 0x1e, 0xc7, 0xda,0x85 };
uint8_t AppSKey[] = { 0xd7, 0x2c, 0x78, 0x75, 0x8c, 0xdc, 0xca, 0xbf, 0x55, 0xee, 0x4a, 0x77, 0x8d, 0x16, 0xef,0x67 };
uint32_t DevAddr =  ( uint32_t )0x007e6ae1;

/*LoraWan channelsmask, default channels 0-7*/ 
uint16_t userChannelsMask[6]={ 0x00FF,0x0000,0x0000,0x0000,0x0000,0x0000 };

/*LoraWan Class, Class A and Class C are supported*/
DeviceClass_t  loraWanClass = CLASS_C;

/*the application data transmission duty cycle.  value in [ms].*/
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
* Number of trials to transmit the frame, if the LoRaMAC layer did not
* receive an acknowledgment. The MAC performs a datarate adaptation,
* according to the LoRaWAN Specification V1.0.2, chapter 18.4, according
* to the following table:
*
* Transmission nb | Data Rate
* ----------------|-----------
* 1 (first)       | DR
* 2               | DR
* 3               | max(DR-1,0)
* 4               | max(DR-1,0)
* 5               | max(DR-2,0)
* 6               | max(DR-2,0)
* 7               | max(DR-3,0)
* 8               | max(DR-3,0)
*
* Note, that if NbTrials is set to 1 or 2, the MAC will not decrease
* the datarate, in case the LoRaMAC layer did not receive an acknowledgment
*/
uint8_t confirmedNbTrials = 4;

/*LoraWan debug level, select in arduino IDE tools.
* None : print basic info.
* Freq : print Tx and Rx freq, DR info.
* Freq && DIO : print Tx and Rx freq, DR, DIO0 interrupt and DIO1 interrupt info.
* Freq && DIO && PW: print Tx and Rx freq, DR, DIO0 interrupt, DIO1 interrupt, MCU sleep and MCU wake info.
*/
uint8_t debugLevel = LoRaWAN_DEBUG_LEVEL;

/*LoraWan region, select in arduino IDE tools*/
LoRaMacRegion_t loraWanRegion = ACTIVE_REGION;

uint32_t count=0;
uint16_t percentage;
    
static void prepareTxFrame( uint8_t port )
{

    float volts;
    volts = MGRead(MG_PIN);
    percentage = MGGetPercentage(volts,CO2Curve);
    Serial.print("CO2: ");
    Serial.print(percentage);
    Serial.print(" ppm (");
    Serial.print(volts);
    Serial.println(" V)");

    uint16_t v=(volts*100);
    appDataSize = 4;//AppDataSize max value is 64
    appData[0] = (uint8_t)(percentage>>8);
    appData[1] = (uint8_t)(percentage);
    appData[2] = (uint8_t)(v>>8);
    appData[3] = (uint8_t)(v);
    for (int i=0; i<4; i++) {
      Serial.print(appData[i]);
      Serial.print(" ");
    }
    Serial.println("");
}


// Add your initialization code here
void setup()
{
  //Heltec.begin(true /*DisplayEnable Enable*/, true /*LoRa Disable*/, true /*Serial Enable*/);
  //Heltec.display->flipScreenVertically();
  //Heltec.display->setFont(ArialMT_Plain_10);
  if(mcuStarted==0)
  {
    LoRaWAN.displayMcuInit();
  }
  Serial.begin(115200);
  while (!Serial);
  SPI.begin(SCK,MISO,MOSI,SS);
  Mcu.init(SS,RST_LoRa,DIO0,DIO1,license);
  deviceState = DEVICE_STATE_INIT;
}

// The loop function is called in an endless loop
void loop()
{
  switch( deviceState )
  {
    case DEVICE_STATE_INIT:
    {
      Serial.println("DEVICE_STATE_INIT");
#if(LORAWAN_DEVEUI_AUTO)
      LoRaWAN.generateDeveuiByChipID();
#endif
      LoRaWAN.init(loraWanClass,loraWanRegion);
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
      count=0;
      break;
    }
    case DEVICE_STATE_SLEEP:
    {
      LoRaWAN.displayAck();
      String text="CO2: ";
      text.concat(percentage);
      text.concat(" ppm");
      displayPPM();
      /*Heltec.display->drawString(0, 42, text.c_str());
      Heltec.display->display();*/
      //Serial.println(text.c_str());
      LoRaWAN.sleep(loraWanClass,debugLevel);
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
  String text="CO2: ";
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
    int j=0;
    float buffer[READ_SAMPLE_TIMES];
    float v=0;
    for (i=0;i<READ_SAMPLE_TIMES;i++) buffer[i]=0;
    for (i=0;i<READ_SAMPLE_TIMES;i++) {
        v=0;
        while (v==0) v=analogRead(mg_pin);
        delay(READ_SAMPLE_INTERVAL);
        j=0;
        while (j<READ_SAMPLE_TIMES && buffer[j]!=0 && buffer[j]<v) j++;
        if (buffer[j]!=0) {
          int k=0;
          for (k=READ_SAMPLE_TIMES-1;k>j;k--) buffer[k]=buffer[k-1];
        }
        buffer[j]=v;
    }

    float total=0;
    j=0;
    for (i=READ_SAMPLE_DROP;i<READ_SAMPLE_TIMES-READ_SAMPLE_DROP;i++) {
      total += buffer[i];
      j++;
    }
    v = (total/j);
    return v*INPUT_VOLT/INPUT_RANGE;
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
  return pow(10, ((volts/DC_GAIN)-pcurve[1])/pcurve[2]+pcurve[0]);
}
