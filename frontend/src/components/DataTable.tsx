import type { TopCategory } from "../types";

type DataTableProps = {
  rows: TopCategory[];
};

const DataTable = ({ rows }: DataTableProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Top category table">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Top Categories Table</h2>
          <p className="section-subtitle">Distribution overview by class with fare and survival context.</p>
        </div>
        <p className="ui-status-tag">{rows.length} Rows</p>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Passengers</th>
              <th>Survival Rate</th>
              <th>Avg Fare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td className="primary-cell">{row.category}</td>
                <td>{row.passengerCount.toLocaleString()}</td>
                <td>{row.survivalRatePct}%</td>
                <td>${row.avgFare.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="empty-row" colSpan={4}>
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
