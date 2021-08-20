<template>
  <div>
    <div class="devicesListCell">{{ device.id }} {{ device.lastupdateAt }}</div>
    <div class="devicesListCell">
      <span v-if="!isEdited">{{ device.name }}</span>
      <input v-if="isEdited" v-model="me.name" />
    </div>
    <div class="devicesListCell devicesListNumberCell">
      <span v-if="!isEdited">{{ device.co2 }}</span>
      <input v-if="isEdited" v-model="me.co2" />
    </div>
    <div class="devicesListCell devicesListNumberCell">
      <span v-if="!isEdited">{{ device.initLevel }}</span>
      <input v-if="isEdited" v-model="me.initLevel" />
    </div>
    <div class="devicesListCell devicesListAction">
      <span v-if="!edit" v-on:click="actionEdit()">Edit</span>
      <span v-if="isEdited" v-on:click="actionOk()"> Ok </span>&nbsp;<span
        v-if="isEdited"
        v-on:click="actionCancel()"
      >
        Cancel
      </span>
    </div>
  </div>
</template>
<style>
.devicesListCell {
  display: table-cell;
}

.devicesListCell {
  border: 1px solid;
  padding: 3px 2px;
}
.devicesListNumberCell,
.devicesListAction {
  text-align: center;
}
</style>

<script>
import axios from "axios";
const ORION_API_URL = process.env.VUE_APP_ORION_API_URL;
const ORIONLD = axios.create({
  baseURL: ORION_API_URL + `/ngsi-ld/v1/`,
  headers: {
    "Content-Type": "application/ld+json",
  },
});

export default {
  props: {
    device: Object,
    edit: Boolean,
    editid: String,
  },
  data() {
    return {
      me: this.device,
    };
  },
  mounted: function () {},
  created: async function () {},
  computed: {
    isEdited: function () {
      return this.edit && this.editid == this.device.id;
    },
  },
  methods: {
    async actionOk() {
      console.log("InitLevel : " + this.initLevel);
      console.log("Name : " + this.me.name);
      try {
        var body = {
          name: {
            type: "Property",
            value: this.me.name,
          },
          "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
          ],
        };
        await ORIONLD.patch("entities/" + this.device.id + "/attrs", body);
      } catch (error) {
        console.log(error);
      }
      try {
        var bodyDevice = {
          co2: {
            type: "Property",
            value: this.me.co2,
          },
          initLevel: {
            type: "Property",
            value: this.me.initLevel,
          },
          "@context": [
            "https://smartdatamodels.org/context.jsonld",
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
          ],
        };
        console.log("Body Device : " + JSON.stringify(bodyDevice, null, 4))
        var response=await ORIONLD.patch(
          "entities/" + this.device.device + "/attrs",
          bodyDevice
        );
        console.log("Response device update : " + response.status);
      } catch (error) {
        console.log(error);
      }
      this.$emit("ok");
    },
    async actionEdit() {
      this.$emit("edit", this.device.id);
    },
    async actionCancel() {
      this.$emit("cancel");
    },
    async loadDevice(deviceid) {
      var device = {};
      try {
        var response = await ORIONLD.get("entities/" + deviceid);
        if (Object.prototype.hasOwnProperty.call(response, "data")) {
          device = response.data;
        }
      } catch (error) {
        console.log(error);
      }

      return device;
    },
    async loadAirQualityObserved() {
      var list = [];
      try {
        var response = await ORIONLD.get(
          "entities/?type=AirQualityObserved&idPattern=urn:ngsi-ld:AirQualityObserved:Co2:*"
        );
        if (Array.isArray(response.data)) {
          for (var i = 0; i < response.data.length; i++) {
            var elt = {
              id: response.data[i].id,
              name: "",
              device: "",
              co2: 0,
              initLevel: 0,
            };

            if (
              Object.prototype.hasOwnProperty.call(response.data[i], "name")
            ) {
              elt.name = response.data[i].name.value;
            }
            if (
              Object.prototype.hasOwnProperty.call(
                response.data[i],
                "refDevice"
              )
            ) {
              elt.device = response.data[i].refDevice.object;
              var device = await this.loadDevice(elt.device);
              if (Object.prototype.hasOwnProperty.call(device, "co2")) {
                elt.co2 = device.co2.value;
              }
              if (Object.prototype.hasOwnProperty.call(device, "initLevel")) {
                elt.initLevel = device.initLevel.value;
              }
            }
            console.log(JSON.stringify(elt, null, 4));
            list.push(elt);
          }
        }
      } catch (error) {
        console.log(error);
      }
      return list;
    },
  },
};
</script>