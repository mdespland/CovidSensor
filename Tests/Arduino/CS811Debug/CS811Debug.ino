#include <Wire.h>


/*=========================================================================
    I2C ADDRESS/BITS
    -----------------------------------------------------------------------*/
#define CCS811_ADDRESS (0x5A)
/*=========================================================================*/

/*=========================================================================
    REGISTERS
    -----------------------------------------------------------------------*/
enum {
  CCS811_STATUS = 0x00,
  CCS811_MEAS_MODE = 0x01,
  CCS811_ALG_RESULT_DATA = 0x02,
  CCS811_RAW_DATA = 0x03,
  CCS811_ENV_DATA = 0x05,
  CCS811_NTC = 0x06,
  CCS811_THRESHOLDS = 0x10,
  CCS811_BASELINE = 0x11,
  CCS811_HW_ID = 0x20,
  CCS811_HW_VERSION = 0x21,
  CCS811_FW_BOOT_VERSION = 0x23,
  CCS811_FW_APP_VERSION = 0x24,
  CCS811_ERROR_ID = 0xE0,
  CCS811_SW_RESET = 0xFF,
};

// bootloader registers
enum {
  CCS811_BOOTLOADER_APP_ERASE = 0xF1,
  CCS811_BOOTLOADER_APP_DATA = 0xF2,
  CCS811_BOOTLOADER_APP_VERIFY = 0xF3,
  CCS811_BOOTLOADER_APP_START = 0xF4
};

enum {
  CCS811_DRIVE_MODE_IDLE = 0x00,
  CCS811_DRIVE_MODE_1SEC = 0x01,
  CCS811_DRIVE_MODE_10SEC = 0x02,
  CCS811_DRIVE_MODE_60SEC = 0x03,
  CCS811_DRIVE_MODE_250MS = 0x04,
};

/*=========================================================================*/

#define CCS811_HW_ID_CODE 0x81

#define CCS811_REF_RESISTOR 100000


uint8_t _i2caddr;
  float _tempOffset;

  uint16_t _TVOC;
  uint16_t _eCO2;

  uint16_t _currentSelected;
  uint16_t _rawADCreading;

  

#define debugSerial SerialUSB
void setup()
{
  debugSerial.begin(115200);
 
    
    while (!debugSerial); // Wait for serial monitor
    debugSerial.println("---CS811 test---");
    if (!begin(0x60)) debugSerial.println("Start failed");
 }
 
void loop()
{
  /*
    byte error, address;
    int nDevices;
 
    debugSerial.println("Scanning...");
 
    nDevices = 0;
    for(address = 1; address < 127; address++ )
    {
        Wire.beginTransmission(address);
        error = Wire.endTransmission();
 
        Wire.beginTransmission(address+1);
 
    if (error == 0 && Wire.endTransmission() != 0 ) // Special flag for SAMD Series
    {
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
 */
    delay(5000);           // wait 5 seconds for next scan
}

void SWReset() {
  // reset sequence from the datasheet
  uint8_t seq[] = {0x11, 0xE5, 0x72, 0x8A};
  write(CCS811_SW_RESET, seq, 4);
}

bool begin(uint8_t addr) {
  _i2caddr = addr;

  _i2c_init();

  SWReset();
  delay(100);
  debugSerial.println("SWReset");
  // check that the HW id is correct
  debugSerial.print("Code (");
  debugSerial.print(CCS811_HW_ID_CODE);
  debugSerial.print(") ");
  uint8_t code=read8(CCS811_HW_ID);
  debugSerial.println(code);
  if (code  != CCS811_HW_ID_CODE)
    return false;

  // try to start the app
  
  write(CCS811_BOOTLOADER_APP_START, NULL, 0);
  delay(100);

  // make sure there are no errors and we have entered application mode
/*  if (checkError())
    return false;
  if (!_status.FW_MODE)
    return false;

  disableInterrupt();

  // default to read every second
  setDriveMode(CCS811_DRIVE_MODE_1SEC);
*/
  return true;
}

void _i2c_init() {
  Wire.begin();
#ifdef ESP8266
  Wire.setClockStretchLimit(500);
#endif
}

void write8(byte reg, byte value) {
  write(reg, &value, 1);
}

uint8_t read8(byte reg) {
  uint8_t ret;
  read(reg, &ret, 1);

  return ret;
}

void read(uint8_t reg, uint8_t *buf, uint8_t num) {
  uint8_t pos = 0;

  // on arduino we need to read in 32 byte chunks
  while (pos < num) {

    uint8_t read_now = min((uint8_t)32, (uint8_t)(num - pos));
    Wire.beginTransmission((uint8_t)_i2caddr);
    Wire.write((uint8_t)reg + pos);
    Wire.endTransmission();
    Wire.requestFrom((uint8_t)_i2caddr, read_now);

    for (int i = 0; i < read_now; i++) {
      buf[pos] = Wire.read();
      pos++;
    }
  }
}

void write(uint8_t reg, uint8_t *buf, uint8_t num) {
  Wire.beginTransmission((uint8_t)_i2caddr);
  Wire.write((uint8_t)reg);
  Wire.write((uint8_t *)buf, num);
  Wire.endTransmission();
}
