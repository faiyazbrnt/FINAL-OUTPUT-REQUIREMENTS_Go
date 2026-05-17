import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgeTrend } from "../types";

type AgeTrendLineChartProps = {
  data: AgeTrend[];
};

const tooltipStyle = {
  borderRadius: 12,
  borderColor: "#d5dfec",
  boxShadow: "0 10px 22px rgba(14,35,75,0.14)",
  backgroundColor: "#ffffff"
};

const AgeTrendLineChart = ({ data }: AgeTrendLineChartProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Age trend line chart">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Survival Trend by Age Band</h2>
          <p className="section-subtitle">Comparison between survival rate and passenger volume.</p>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#deebf8" />
            <XAxis dataKey="ageBand" tick={{ fontSize: 12, fill: "#405372" }} axisLine={{ stroke: "#c3d2e6" }} />
            <YAxis tick={{ fontSize: 12, fill: "#405372" }} axisLine={{ stroke: "#c3d2e6" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "0.82rem", color: "#405372" }} />
            <Line
              type="monotone"
              dataKey="survivalRatePct"
              stroke="#1352d9"
              strokeWidth={2.6}
              activeDot={{ r: 5.4 }}
              name="Survival Rate (%)"
            />
            <Line type="monotone" dataKey="passengerCount" stroke="#0f8f82" strokeWidth={2.6} name="Passengers" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default AgeTrendLineChart;
