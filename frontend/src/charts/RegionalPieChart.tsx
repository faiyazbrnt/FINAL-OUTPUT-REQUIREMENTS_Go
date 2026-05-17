import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RegionDistribution } from "../types";

type RegionalPieChartProps = {
  data: RegionDistribution[];
};

const colors = ["#155eef", "#0f9f8f", "#f79009", "#f04438", "#6941c6", "#1570ef"];
const tooltipStyle = {
  borderRadius: 12,
  borderColor: "#d5dfec",
  boxShadow: "0 10px 22px rgba(14,35,75,0.14)",
  backgroundColor: "#ffffff"
};

const RegionalPieChart = ({ data }: RegionalPieChartProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Regional distribution pie chart">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Embarkation Distribution</h2>
          <p className="section-subtitle">Share percentage by boarding region.</p>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="sharePct" nameKey="region" cx="50%" cy="50%" outerRadius={95} label>
              {data.map((entry) => (
                <Cell key={entry.region} fill={colors[Math.abs(entry.region.length) % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value}%`}
              contentStyle={tooltipStyle}
            />
            <Legend wrapperStyle={{ fontSize: "0.82rem", color: "#405372" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default RegionalPieChart;
