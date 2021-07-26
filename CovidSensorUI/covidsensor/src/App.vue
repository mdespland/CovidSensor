<template>
  <div id="main">
    <GraphSelector :attribute="attribute" @choose="chooseAttribute" id="menu"/>
    <CO2SensorHistory :attribute="attribute" id="graph"/>
  </div>
</template>

<script>
import GraphSelector from './components/GraphSelector.vue'
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
  methods: {
    chooseAttribute(attribute) {
      console.log("Attribute switch to "+attribute)
      this.attribute=attribute
    }
  },
  components: {
    GraphSelector,
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
  margin-top: 10px;
  width: 100%;
  height:100vh;
  display: table;
}
#main {
  height:100%;
  clear: both;
  width: 100%;
  display:table-row;
}

#menu {
  height:100%;
  width:15%;
  display: table-cell;
  vertical-align: top;
}

#graph {
  width:85%;
  height:100%;
  display: table-cell;
}
</style>
