<template>
  <div>
    <ul v-if="errors && errors.length">
      <li v-for="error of errors" :key="error">
        {{ error.message }}
      </li>
    </ul>
    <line-chart v-if="loaded" :chartdata="chartdata" :options="options" />
  </div>
</template>

<script>
import axios from "axios";
import LineChart from "./Chart.vue";

const ORIONLD = axios.create({
  baseURL: `http://172.17.0.1:8082/ngsi-ld/v1/`,
  headers: {
    Accept: "application/ld+json",
    Link: '<https://smartdatamodels.org/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
  },
});

export default {
  components: { LineChart },
  props: {
    sensorid: String,
  },
  data() {
    return {
      sensor: null,
      errors: [],
      loaded: false,
      chartdata: null,
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
      timer: "",
    };
  },
  mounted: function () {
    this.loaded = false;
  },
  methods: {
    loadData() {
      var date = new Date(Date.now() - 12 * 60 * 60 * 1000);
      console.log("Origin :"+date.toISOString())
      ORIONLD.get(
        "temporal/entities/" +
          this.sensorid +
          "?timeAt=" +
          date.toISOString() +
          "&timerel=after&attrs=co2&options=temporalValues"
      )
        .then((res) => {
          this.sensor = res.data;
          if (
            Object.prototype.hasOwnProperty.call(this.sensor, "co2") &&
            Object.prototype.hasOwnProperty.call(this.sensor.co2, "values") &&
            Array.isArray(this.sensor.co2.values)
          ) {
            //if (this.sensor.hasOwnProperty('co2') && this.sensor.co2.hasOwnProperty('values') && Array.isArray(this.sensor.co2.values)) {
            this.chartdata = {
              labels: [],
              datasets: [],
            };
            var data = {
              label: this.sensorid,
              backgroundColor: "#f87979",
              data: [],
            };
            for (var i = 0; i < this.sensor.co2.values.length; i++) {
              var point = {};
              var date = new Date(this.sensor.co2.values[i][1]);
              this.chartdata.labels.push(
                (date.getHours() < 10 ? "0" : "") +
                  date.getHours() +
                  ":" +
                  (date.getMinutes() < 10 ? "0" : "") +
                  date.getMinutes()
              );
              point.x = date.toTimeString();
              point.y = this.sensor.co2.values[i][0];
              data.data.push(this.sensor.co2.values[i][0]);
            }
            this.chartdata.datasets.push(data);
            this.loaded = true;
          }
        })
        .catch((e) => {
          this.errors.push(e);
        });
    },
    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
  },
  created: function () {
    this.loadData();
    this.timer = setInterval(this.loadData, 10*60*1000);
  },
  beforeDestroy: function () {
    this.cancelAutoUpdate();
  }
};
</script>