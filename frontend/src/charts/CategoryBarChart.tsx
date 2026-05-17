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
const tooltipStyle = {
  borderRadius: 12,
  borderColor: "#d5dfec",
  boxShadow: "0 10px 22px rgba(14,35,75,0.14)",
  backgroundColor: "#ffffff"
};

const CategoryBarChart = ({ data }: CategoryBarChartProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Top categories bar chart">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Top Categories</h2>
          <p className="section-subtitle">Passenger count by class category.</p>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#deebf8" />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#405372" }} axisLine={{ stroke: "#c3d2e6" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#405372" }} axisLine={{ stroke: "#c3d2e6" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "0.82rem", color: "#405372" }} />
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
