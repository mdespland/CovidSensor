#ifndef _SAMPLE_H
#define _SAMPLE_H
#include <Arduino.h>

#define NULL_SAMPLE_VALUE 65536

class Sample {
private:
  float * data=NULL;
  unsigned int size;
public:
  Sample(unsigned int size);
  ~Sample();
  void init();
  void add(float value);
  float deviation(unsigned int drop, float average);
  float average(unsigned int drop);
  float value(float maxdeviation);

};


#endif
