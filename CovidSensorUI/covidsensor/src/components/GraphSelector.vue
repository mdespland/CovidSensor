<template>
  <div id="buttons">
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='co2'}" v-on:click="send('co2')">Co2</button></div>
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='temperature'}" v-on:click="send('temperature')">Temperature</button></div>
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='relativeHumidity'}" v-on:click="send('relativeHumidity')">Humidity</button></div>
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='volatileOrganicCompoundsTotal'}" v-on:click="send('volatileOrganicCompoundsTotal')">Volatile Compounds</button></div>
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='pressure'}" v-on:click="send('pressure')">Pressure</button></div>
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='elevation'}" v-on:click="send('elevation')">Altitude</button></div>
    <div class="row"><button class="selector" v-bind:class="{ selected: attribute=='voltage'}" v-on:click="send('voltage')">Voltage</button></div>
  </div>
</template>

<style>
#buttons {
    height: 100%;
}

.selector {
    width: 90%;
    height:60px;
    font-size: 14px;
    font-weight: bold;
    font-family: Arial, Helvetica, sans-serif;
    background-color: #8a9900;
    color: #FFFFFF;
}
.selected {
    background-color: #ec4949;
    color: #FFFFFF;
}
</style>

<script>
export default {
  props: {
    attribute: String,
  },
  data() {
    return {
    };
  },
  created: function () {
  },
  methods: {
      send(message) {
          console.log("Emit message : "+message)
          this.$emit("choose",message)
      }
  }
};
</script>
