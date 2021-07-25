#ifndef _SAMPLE_H
#define _SAMPLE_H


class Sample {
private:
  float * buffer;
  unsigned int size;
public:
  Sample(unsigned int size);
  void init();
  void add(float value);
  float deviation(unsigned int drop, float average);
  float average(unsigned int drop);

};


#endif
