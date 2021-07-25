#include "Sample.h";
#include "Arduino.h"

Sample::Sample(unsigned int size) {
  this->size = size;
  this->buffer = new float[this->size];
  this->init();

}

void Sample::init() {
  for (int i = 0; i < this->size; i++) this->buffer[i] = 0;
}



void Sample::add(float value) {
  int i = 0;
  while (i < this->size && this->buffer[i] != 0 && this->buffer[i] < value) i++;
  if (this->buffer[i] != 0) {
    for (int j = this->size - 1; j > j; j--) this->buffer[j] = this->buffer[j - 1];
  }
  this->buffer[i] = value;
}


float Sample::deviation(unsigned int drop, float average) {
  int count = 0;
  float total = 0;
  for (int i = drop; i < (this->size - drop); i++) {
    total += sq(this->buffer[i] - average);
    count++;
  }
  return sqrt(total / count);
}

float Sample::average(unsigned int drop) {
  int count = 0;
  float total = 0;
  for (int i = drop; i < (this->size - drop); i++) {
    total += this->buffer[i];
    count++;
  }
  return (total / count);
}
