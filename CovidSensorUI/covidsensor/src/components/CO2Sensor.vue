<template>
  <div>
    <ul>
      <li v-for="(value, key) in sensor" :key="key">{{ key }} : {{ value }}</li>
    </ul>
    <ul v-if="errors && errors.length">
      <li v-for="(error) of errors" :key="error">
        {{ error.message }}
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";

const ORION_API_URL= process.env.VUE_APP_ORION_API_URL
const DEFAULT_TOKEN= process.env.VUE_APP_DEFAULT_TOKEN

const ORIONLD = axios.create({
  baseURL: ORION_API_URL +`/ngsi-ld/v1/`,
  headers: {
    Test: "002",
    Link: '<https://smartdatamodels.org/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
    'X-Auth-Token': DEFAULT_TOKEN
  },
});

export default {
  data() {
    return {
      sensor: null,
      errors: [],
    };
  },
  created: function () {
    ORIONLD.get(
      "entities/urn:ngsi-ld:AirQualityObserved:Co2:sensor1?options=keyValues"
    )
      .then((res) => {
        this.sensor = res.data;
      })
      .catch((e) => {
        this.errors.push(e);
      });
  },
};
</script>