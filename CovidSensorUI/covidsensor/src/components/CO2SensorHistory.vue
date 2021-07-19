<template>
  <div>
    <ul v-if="errors && errors.length">
      <li v-for="error of errors" :key="error">
        {{ error.message }}
      </li>
    </ul>
    <line-chart v-if="loaded" :chartData="chartdata" :options="options" />
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
      count: 0,
      sensor: null,
      errors: [],
      loaded: false,
      requested: false,
      chartdata: {
        labels: [],
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
  },
  methods: {
    loadData() {
      var now = new Date(Date.now());

      if (!this.requested) {
        this.requested = true;
        console.log("Request start  :" + now.toISOString());
        var date = new Date(Date.now() - 12 * 60 * 60 * 1000);
        console.log("\tOrigin :" + date.toISOString());

        ORIONLD.get(
          "temporal/entities/" +
            this.sensorid +
            "?timeAt=" +
            date.toISOString() +
            "&timerel=after&attrs=co2&options=temporalValues"
        )
          .then((res) => {
            now = new Date(Date.now());
            console.log("\treceiving response  :" + now.toISOString());
            this.sensor = res.data;
            if (
              Object.prototype.hasOwnProperty.call(this.sensor, "co2") &&
              Object.prototype.hasOwnProperty.call(this.sensor.co2, "values") &&
              Array.isArray(this.sensor.co2.values)
            ) {
              //if (this.sensor.hasOwnProperty('co2') && this.sensor.co2.hasOwnProperty('values') && Array.isArray(this.sensor.co2.values)) {

              var newdata = {
                labels: [],
                datasets: [],
              };
              //this.chartdata.labels.length=0;
              //this.chartdata.datasets.length=0;
              var data = {
                label: this.sensorid,
                backgroundColor: "#f87979",
                data: [],
              };
              for (var i = 0; i < this.sensor.co2.values.length; i++) {
                var point = {};
                var date = new Date(this.sensor.co2.values[i][1]);
                newdata.labels.push(
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
              newdata.datasets.push(data);
              //delete old datasets
              /*console.log("\t\tDeleting labels")
              while (this.chartdata.labels.length > 0) {
                this.chartdata.labels.pop();
              }
              console.log("\t\tDeleting datasets")
              while (this.chartdata.datasets.length > 0) {
                this.chartdata.datasets.pop();
              }*/
              //replace with the new one
              //this.loaded = false;
              this.chartdata = newdata;
              this.loaded = true;
            }
            now = new Date(Date.now());
            this.requested = false;
            console.log("Request end  :" + now.toISOString());
          })
          .catch((e) => {
            now = new Date(Date.now());
            this.errors.push(now.toISOString()+" : "+e);
          });
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
    this.loadData();
    this.timer = setInterval(this.loadData, 10 * 60 * 1000);
  },
  beforeDestroy: function () {
    this.cancelAutoUpdate();
  },
};
</script>