#include "Sample.h";
#include "Arduino.h"
#define debugSerial Serial

Sample::Sample(unsigned int mysize) {
  size = mysize;
  data = new float[size];
  init();

}

Sample::~Sample() {
  debugSerial.println("Delete Sample");
  if (data!=NULL) delete[] data;
  data=NULL;

}

void Sample::init() {
  for (int i = 0; i < size; i++) data[i] = 0;
}



void Sample::add(float value) {
  int i = 0;
//  debugSerial.print(value);
//  debugSerial.print(" ");
  while (i < size && data[i] != 0 && data[i] < value) i++;
  if (i<size) {
    if (data[i] != 0) {
      for (int j = size - 1; j > i; j--) data[j] = data[j - 1];
    }
    data[i] = value;
  } else {
    debugSerial.print(i);
    debugSerial.print(" ");
    debugSerial.print(size);
    debugSerial.print(" ");
    debugSerial.print(value);
    debugSerial.println(" Try to access out of range");
  } 
}


float Sample::deviation(unsigned int drop, float average) {
  int count = 0;
  float total = 0;
  for (int i = drop; i < (size - drop); i++) {
    total += sq(data[i] - average);
    count++;
  }
  return sqrt(total / count);
}

float Sample::average(unsigned int drop) {
  int count = 0;
  float total = 0;
  for (int i = drop; i < (size - drop); i++) {
    total += data[i];
    count++;
  }
  return (total / count);
}

float Sample::value(float maxdeviation) {
  unsigned int drop=0;
  float percentage=100;
  float averagef=0;
  float deviationf=0;
  while ((percentage>maxdeviation) && (drop<size/4)) {
    averagef=average(drop);
    deviationf=deviation(drop, averagef);
    if (averagef>0) {
      if (averagef<10) {
        percentage=maxdeviation;
      } else {
        percentage=deviationf*100/averagef;
      }
    } else {
      percentage=0;
    }
    drop++;
    debugSerial.print("Average : ");
    
    debugSerial.print(averagef);
    debugSerial.print(" Percentage : ");
    debugSerial.println(percentage);
    
  }
  if (drop>=(size/4)) averagef=-1;
  return averagef;
}
