<script>
import { Line } from 'vue3-chart-v2'
    /*chartData: {
      type: Object,
      default: null
    },*/

export default {
  extends: Line,
  props: {
    chartData: {
      type: Object,
      default: null
    },
    options: {
      type: Object,
      default: null
    }
  },
  mounted () {
    this.renderChart(this.chartData, this.options)
  },
  watch: {
    chartData: function() {
      //this._chart.Destroy();
      //this.renderChart(this.data, this.options);
      this.renderChart(this.chartData, this.options)
    //this.setChartData(this.chartData)
    }
  }
}
</script>