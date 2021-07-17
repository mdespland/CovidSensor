<template>
  <div>  
    <CO2SensorHistory sensorid="urn:ngsi-ld:AirQualityObserved:Co2:sensor1"/>
    <CO2Sensor/>
  </div>
</template>

<script>
import CO2Sensor from './components/CO2Sensor.vue'
import CO2SensorHistory from './components/CO2SensorHistory.vue'
export default {
  name: 'App',
  components: {
    CO2Sensor,
    CO2SensorHistory
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
