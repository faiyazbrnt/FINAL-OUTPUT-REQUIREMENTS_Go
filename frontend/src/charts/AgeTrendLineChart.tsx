import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgeTrend } from "../types";

type AgeTrendLineChartProps = {
  data: AgeTrend[];
};

const AgeTrendLineChart = ({ data }: AgeTrendLineChartProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Age trend line chart">
      <div className="panel-header">
        <h2 className="text-base font-semibold">Survival Trend by Age Band</h2>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="ageBand" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="survivalRatePct"
              stroke="#155eef"
              strokeWidth={2}
              activeDot={{ r: 5 }}
              name="Survival Rate (%)"
            />
            <Line type="monotone" dataKey="passengerCount" stroke="#0f9f8f" strokeWidth={2} name="Passengers" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default AgeTrendLineChart;
