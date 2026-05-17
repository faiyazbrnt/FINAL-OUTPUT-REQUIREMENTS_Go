import type { TopCategory } from "../types";

type DataTableProps = {
  rows: TopCategory[];
};

const DataTable = ({ rows }: DataTableProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Top category table">
      <div className="panel-header">
        <h2 className="text-base font-semibold">Top Categories Table</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-2 py-2 font-semibold">Category</th>
              <th className="px-2 py-2 font-semibold">Passengers</th>
              <th className="px-2 py-2 font-semibold">Survival Rate</th>
              <th className="px-2 py-2 font-semibold">Avg Fare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-b border-slate-100">
                <td className="px-2 py-2 font-medium text-slate-800">{row.category}</td>
                <td className="px-2 py-2 text-slate-700">{row.passengerCount.toLocaleString()}</td>
                <td className="px-2 py-2 text-slate-700">{row.survivalRatePct}%</td>
                <td className="px-2 py-2 text-slate-700">${row.avgFare.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={4}>
                  No records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DataTable;
