import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RegionDistribution } from "../types";

type RegionalPieChartProps = {
  data: RegionDistribution[];
};

const colors = ["#155eef", "#0f9f8f", "#f79009", "#f04438", "#6941c6", "#1570ef"];

const RegionalPieChart = ({ data }: RegionalPieChartProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Regional distribution pie chart">
      <div className="panel-header">
        <h2 className="text-base font-semibold">Embarkation Distribution</h2>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="sharePct" nameKey="region" cx="50%" cy="50%" outerRadius={95} label>
              {data.map((entry) => (
                <Cell key={entry.region} fill={colors[Math.abs(entry.region.length) % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default RegionalPieChart;
