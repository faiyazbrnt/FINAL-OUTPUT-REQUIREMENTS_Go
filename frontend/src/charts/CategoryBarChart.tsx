import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TopCategory } from "../types";

type CategoryBarChartProps = {
  data: TopCategory[];
};

const colors = ["#155eef", "#0f9f8f", "#f79009", "#dc6803", "#667085", "#101828", "#12b76a", "#7a5af8"];

const CategoryBarChart = ({ data }: CategoryBarChartProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Top categories bar chart">
      <div className="panel-header">
        <h2 className="text-base font-semibold">Top Categories (Passenger Count)</h2>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="passengerCount" name="Passengers">
              {data.map((entry) => (
                <Cell key={entry.category} fill={colors[Math.abs(entry.category.length) % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default CategoryBarChart;
