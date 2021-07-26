<template>
  <div style="height:100%">
    <line-chart v-if="loaded" :chartData="chartdata" :options="options" :requested="requested" style="height:100%; " />
  </div>
</template>

<script>
import axios from "axios";
import LineChart from "./Chart.vue";
const ORION_API_URL = process.env.VUE_APP_ORION_API_URL;
const ORIONLD = axios.create({
  baseURL: ORION_API_URL + `/ngsi-ld/v1/`,
  headers: {
    Accept: "application/ld+json",
    Link: '<https://smartdatamodels.org/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
  },
});

const GRAPHICS_TIME_RANGE = 12 * 60 * 60 * 1000;
const GRAPHICS_TIME_INTERVAL = 10 * 60 * 1000;

export default {
  components: { LineChart },
  props: {
    sensorid: String,
    sensors: Array,
  },
  data() {
    return {
      count: 0,
      sensor: null,
      errors: [],
      loaded: false,
      requested: false,
      chartdata: {
        labels: new Array(GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL),
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
      timer: "",
    };
  },
  mounted: function () {
    this.loaded = false;

    //console.log(JSON.stringify(this.chartdata, null, 4))
    console.log("Mounted done");
  },
  methods: {
    loadLabels(start) {
      var starttime = start.getTime();
      for (var i = 0; i < GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL; i++) {
        var date = new Date(starttime + i * GRAPHICS_TIME_INTERVAL);
        this.chartdata.labels[i] =
          (date.getHours() < 10 ? "0" : "") +
          date.getHours() +
          ":" +
          (date.getMinutes() < 10 ? "0" : "") +
          date.getMinutes();
      }
    },
    async loadSensor(datasetid, sensorid, start, backgroundColor) {
      this.chartdata.datasets[datasetid].label = sensorid;
      this.chartdata.datasets[datasetid].borderColor = backgroundColor;
      for (var i = 0; i < GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL; i++) {
        this.chartdata.datasets[datasetid].data[i] = 0;
      }
      try {
        var response = await ORIONLD.get(
          "temporal/entities/" +
            sensorid +
            "?timeAt=" +
            start.toISOString() +
            "&timerel=after&attrs=co2&options=temporalValues"
        );
        if (
          Object.prototype.hasOwnProperty.call(response.data, "co2") &&
          Object.prototype.hasOwnProperty.call(response.data.co2, "values") &&
          Array.isArray(response.data.co2.values)
        ) {
          for (i = 0; i < response.data.co2.values.length; i++) {
            var date = new Date(response.data.co2.values[i][1]);
            var indice = Math.floor(
              (date.getTime() - start.getTime()) / GRAPHICS_TIME_INTERVAL
            );
            //console.log("Indice : "+indice+ "  :  "+response.data.co2.values[i][0])
            this.chartdata.datasets[datasetid].data[indice] =
              response.data.co2.values[i][0];
          }
        }
      } catch (error) {
        console.log("\tError :" + error);
      }
    },
    async loadData() {
      var now = new Date(Date.now());
      console.log("Request start  :" + now.toISOString());
      if (!this.requested) {
        this.requested = true;
        var start = new Date((Math.floor(Date.now() / GRAPHICS_TIME_INTERVAL) * GRAPHICS_TIME_INTERVAL) - GRAPHICS_TIME_RANGE);
        console.log("\tOrigin :" + start.toISOString());
        this.loadLabels(start)
        for (var j = 0; j < this.sensors.length; j++) {
          await this.loadSensor(
            j,
            this.sensors[j].id,
            start,
            this.sensors[j].backgroundColor
          );
        }
        //console.log("loadData  "+JSON.stringify(this.chartdata, null, 4))
        now = new Date(Date.now());
        this.requested = false;
        this.loaded = true;
        console.log("Request end  :" + now.toISOString());
      } else {
        now = new Date(Date.now());
        console.log("\tAlready managing request  :" + now.toISOString());
      }
    },
    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
  },
  created: function () {
    console.log("Sensors : " + JSON.stringify(this.sensors, null, 4))
    console.log("Array size :"+GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL)
    for (var j = 0; j < this.sensors.length; j++) {
      var data = {
        label: "",
        borderColor: "#f87979",
        data: new Array(GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL),
      };
      this.chartdata.datasets.push(data);
    }
    for (var i = 0; i < GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL; i++) {
      this.chartdata.labels[i] = "";
      for (j = 0; j < this.sensors.length; j++) {
        this.chartdata.datasets[j].data[i] = 0;
      }
    }
    this.loadData();
    this.timer = setInterval(this.loadData, 10 * 60 * 1000);
  },
  beforeUnmount: function () {
    this.cancelAutoUpdate();
  },
};
</script>