
At Orange we have distribute years ago a [Lora Explorer Kit]() based on SODAQ Explorer to help people start working with Lora and our LoarWan platform manage by LiveObject.
I have keep several of those board so I using them for this project, but any LoraWan + Arduino like controller is usable for this purpose.

We use two kind of sensors

* [CO2 Sensor v1.2](https://wiki.dfrobot.com/CO2_Sensor_SKU_SEN0159)
* [CMJU-CCS811]() eCo2+Cov sensor with [BEM280]() I2C 5v temperature + humidity

# SODAQ Explorer Based sensor

## CMJU-CCS811

We use it with [CCS811 Sparkfun Library](https://github.com/sparkfun/SparkFun_CCS811_Arduino_Library)

Need to use baseline feature for callibration

