#include <Wire.h>


#define debugSerial SerialUSB
void setup()
{
  debugSerial.begin(115200);
  Wire.begin();
 
    
    while (!debugSerial); // Wait for serial monitor
    debugSerial.println("---I2C Scanner---");
}
 
void loop()
{
    byte error, address;
    int nDevices;
 
    debugSerial.println("Scanning...");
 
    nDevices = 0;
    for(address = 1; address < 255; address++ )
    {
        Wire.beginTransmission(address);
        error = Wire.endTransmission();
 
        //Wire.beginTransmission(address+1);
 
   // if (error == 0 && Wire.endTransmission() != 0 ) // Special flag for SAMD Series
    if (error == 0) {
        debugSerial.print("I2C device found at address 0x");
        if (address<16)
            debugSerial.print("0");
        debugSerial.print(address,HEX);
        debugSerial.println("!");
 
        nDevices++;
    }
    else if (error==4) 
    {
        debugSerial.print("Unknown error at address 0x");
        if (address<16) 
            debugSerial.print("0");
        debugSerial.println(address,HEX);
    }
    }
    if (nDevices == 0)
        debugSerial.println("No I2C devices found\n");
    else
        debugSerial.println("done\n");
 
    delay(5000);           // wait 5 seconds for next scan
}
