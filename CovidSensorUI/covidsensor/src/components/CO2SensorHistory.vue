<template>
  <div>
    <line-chart
      v-if="loaded"
      :chartdata="chartdata"
      :options="options"
      :requested="requested"
      style="height: 100%"
    />
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
    attribute: String,
  },
  data() {
    return {
      count: 0,
      sensors: {
        indice:0
      },
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
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
        animation: {
          duration: 0, // general animation time
        },
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
    async deviceName(id) {
      var name=id;
      try {
        var response = await ORIONLD.get("entities/"+id);
        if ((Object.prototype.hasOwnProperty.call(response, "data")) && (Object.prototype.hasOwnProperty.call(response.data, "name"))) {
          name=response.data.name.value;
        }
      }catch (error) {
        console.log(error)
      }
      return name;
    },
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
    async loadSensorData() {
      var now = new Date(Date.now());
      console.log("Request start  :" + now.toISOString());
      if (!this.requested) {
        this.requested = true;
        var start = new Date(
          Math.floor(Date.now() / GRAPHICS_TIME_INTERVAL) *
            GRAPHICS_TIME_INTERVAL -
            GRAPHICS_TIME_RANGE
        );
        console.log("\tOrigin :" + start.toISOString());
        this.loadLabels(start);
        try {
          this.chartdata.datasets = [];
          var response = await ORIONLD.get(
            "temporal/entities/" +
              "?type=AirQualityObserved&timeAt=" +
              start.toISOString() +
              "&timerel=after&attrs=" +
              this.attribute +
              "&options=temporalValues&idPattern=urn:ngsi-ld:AirQualityObserved:Co2:*"
          );
          if (Array.isArray(response.data)) {
            for (var i = 0; i < response.data.length; i++) {
              var dataset = await this.initDataSet(response.data[i]);
              if (
                Object.prototype.hasOwnProperty.call(
                  response.data[i],
                  this.attribute
                ) &&
                Object.prototype.hasOwnProperty.call(
                  response.data[i][this.attribute],
                  "values"
                ) &&
                Array.isArray(response.data[i][this.attribute].values)
              ) {
                //here we can load the data
                for (
                  var j = 0;
                  j < response.data[i][this.attribute].values.length;
                  j++
                ) {
                  var date = new Date(
                    response.data[i][this.attribute].values[j][1]
                  );
                  var indice = Math.floor(
                    (date.getTime() - start.getTime()) / GRAPHICS_TIME_INTERVAL
                  );
                  //console.log("Indice : "+indice+ "  :  "+response.data.co2.values[i][0])
                  dataset.data[indice] =
                    response.data[i][this.attribute].values[j][0];
                }
              }
              this.chartdata.datasets.push(dataset);
            }
          }
        } catch (error) {
          console.log("\tError :" + error);
        }
        for (i=0;i<this.chartdata.datasets.length;i++) {
          for (j=1;j<this.chartdata.datasets[i].data.length-1;j++) {
            if ((this.chartdata.datasets[i].data[j-1]!==0) && (this.chartdata.datasets[i].data[j]===0) && (this.chartdata.datasets[i].data[j+1]!==0)) {
              this.chartdata.datasets[i].data[j]=(this.chartdata.datasets[i].data[j-1]+this.chartdata.datasets[i].data[j+1])/2;
            }
          }
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
    async initDataSet(sensor) {
      var data = {
        label: "",
        borderColor: "#f87979",
        data: new Array(GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL),
      };
      data.label=await this.deviceName(sensor.id);
      if (!Object.prototype.hasOwnProperty.call(this.sensors, sensor.id)) {
        this.sensors[sensor.id]=this.borderColor(this.sensors.indice);
        this.sensors.indice++;
      }
      data.borderColor=this.sensors[sensor.id];
      for (var i = 0; i < GRAPHICS_TIME_RANGE / GRAPHICS_TIME_INTERVAL; i++) {
        data.data[i] = 0;
      }
      return data;
    },
    borderColor(indice) {
      var color = "#000000";
      switch (indice) {
        case 0:
          color = "#990000";
          break;
        case 1:
          color = "#009900";
          break;
        case 2:
          color = "#000099";
          break;
        case 3:
          color = "#990099";
          break;
        case 4:
          color = "#009999";
          break;
        case 5:
          color = "#999900";
          break;
      }
      return color;
    },
    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
  },
  created: function () {
    this.loadSensorData();
    this.timer = setInterval(this.loadSensorData, 10 * 60 * 1000);
  },
  beforeUnmount: function () {
    this.cancelAutoUpdate();
  },
  watch: {
    attribute: async function () {
      if (!this.requested) {
        console.log("Redraw charts on attribute");
        await this.loadSensorData();
      }
    },
  },
};
</script>