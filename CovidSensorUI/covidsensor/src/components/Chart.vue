<script>
import { Line } from 'vue3-chart-v2'
    /*chartData: {
      type: Object,
      default: null
    },*/

export default {
  extends: Line,
  props: {
    chartdata: {
      type: Object,
      default: null
    },
    options: {
      type: Object,
      default: null
    },
    requested: Boolean
  },
  mounted () {
    this.renderChart(this.chartdata, this.options)
  },
  watch: {
    chartData: function() {
      //this._chart.Destroy();
      //this.renderChart(this.data, this.options);
      console.log("Redraw charts on chartsData")
      //this.renderChart(this.chartData, this.options)
    //this.setChartData(this.chartData)
    },
    requested: function() {
      if (!this.requested) {
        console.log("Redraw charts on Requested")
        this.renderChart(this.chartdata, this.options)
      }
    }
  }
}
</script>