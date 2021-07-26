<template>
  <div style="height:800px">  
    <CO2SensorHistory :attribute="attribute"/>
<!--     <CO2SensorHistory sensorid="urn:ngsi-ld:AirQualityObserved:Co2:sensor2"/>
     <CO2SensorHistory sensorid="urn:ngsi-ld:AirQualityObserved:Co2:sensor3"/>
     <CO2SensorHistory sensorid="urn:ngsi-ld:AirQualityObserved:Co2:sensor4"/>-->
  <!--  <CO2Sensor/>-->
  </div>
</template>

<script>
//import CO2Sensor from './components/CO2Sensor.vue'
import CO2SensorHistory from './components/CO2SensorHistory.vue'
export default {
  name: 'App',
  provide:{
    ORION_API_URL : ''
  },
  data() {
    return {
      attribute: "co2",
      sensors: [ {
        id: "urn:ngsi-ld:AirQualityObserved:Co2:sensor1",
        backgroundColor: "#FF0000"
      },{
        id: "urn:ngsi-ld:AirQualityObserved:Co2:sensor2",
        backgroundColor: "#00FF00"
      },{
        id: "urn:ngsi-ld:AirQualityObserved:Co2:sensor3",
        backgroundColor: "#FFFF00"
      },{
        id: "urn:ngsi-ld:AirQualityObserved:Co2:sensor4",
        backgroundColor: "#0000FF"
      }

      ]
    };
  },
  components: {
//    CO2Sensor,
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
