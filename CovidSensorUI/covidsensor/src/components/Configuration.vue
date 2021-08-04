<template>
  <div>
    <div id="devicesList">
      <div id="devicesListHeader">
        <div class="devicesListRow">
          <div class="devicesListHeaderCell">Id</div>
          <div class="devicesListHeaderCell">Name</div>
          <div class="devicesListHeaderCell">Threshold</div>
          <div class="devicesListHeaderCell">Init Level</div>
          <div class="devicesListHeaderCell">Action</div>
        </div>
      </div>
      <div id="devicesListBody">
        <DeviceConfiguration class="devicesListRow" v-for="device in list" :key="device.id" :device="device" :edit="edit" :editid="editid" @ok="actionOk" @edit="actionEdit" @cancel="actionCancel"/>
      </div>
    </div>
  </div>
</template>
<style>
#devicesList {
  display: table;
  border: 1px solid;
  width: 100%;
  text-align: left;
  border-collapse: collapse;
}
#devicesListHeader {
  display: table-header-group;
}

#devicesListHeaderRow {
  display: table-row;
}
#devicesListBody {
  display: table-header-group;
}

.devicesListRow {
  display: table-row;
}
.devicesListCell,
.devicesListHeaderCell {
  display: table-cell;
}

.devicesListCell, .devicesListHeaderCell {
  border: 1px solid;
  padding: 3px 2px;
}

.devicesListHeaderCell {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
}

.devicesListNumberCell, .devicesListAction{
    text-align: center;
}
</style>

<script>
import axios from "axios";
import DeviceConfiguration from './DeviceConfiguration.vue'
const ORION_API_URL = process.env.VUE_APP_ORION_API_URL;
const ORIONLD = axios.create({
  baseURL: ORION_API_URL + `/ngsi-ld/v1/`,
  headers: {
    Accept: "application/ld+json",
    Link: '<https://smartdatamodels.org/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
  },
});

export default {
  components: {
    DeviceConfiguration
  },
  props: {},
  data() {
    return {
      list: [],
      edit: false,
      editid: ""
    };
  },
  mounted: function () {},
  created: async function () {
    this.list = await this.loadAirQualityObserved();
  },
  methods: {
    async actionOk() {
      console.log("Action OK ")
      this.edit=false;
      this.editid=""
      this.list= await this.loadAirQualityObserved();
    },
    actionCancel() {
      console.log("Action Cancel")
      this.edit=false;
      this.editid=""
    },
    actionEdit(deviceid) {
      console.log("Action Edit")
      this.edit=true;
      this.editid=deviceid
    },
    async loadDevice(deviceid) {
      var device = {};
      try {
        var response = await ORIONLD.get("entities/" + deviceid);
        if (Object.prototype.hasOwnProperty.call(response, "data")) {
          //console.log(JSON.stringify(response.data, null, 4));
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
                console.log("Read CO2 from device : "+elt.co2)
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