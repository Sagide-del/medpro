export default function CaseTableActivity({ activity, value = { rows: {} }, onChange }) {
  const rows = activity?.table?.rows || [];
  const columns = activity?.table?.columns || [];

  function updateCell(rowId, field, cellValue) {
    const nextRows = {
      ...(value.rows || {}),
      [rowId]: {
        ...((value.rows || {})[rowId] || {}),
        [field]: cellValue,
      },
    };
    onChange({ rows: nextRows });
  }

  return (
    <div className="card case-activity-card">
      <div className="mcq-review-head">
        <div>
          <div className="case-section-kicker">{activity.phase}</div>
          <h2>{activity.title}</h2>
        </div>
        <span className="badge draft">{activity.points} pts</span>
      </div>

      <pre className="case-phase-body">{activity.prompt}</pre>

      <div className="case-data-table-scroll">
        <table className="case-data-table case-entry-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.row_id}>
                <td>{row.label}</td>
                {row.fields.map((field) => (
                  <td key={`${row.row_id}-${field}`}>
                    <textarea
                      rows={3}
                      value={(value.rows || {})[row.row_id]?.[field] || ''}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      onChange={(event) => updateCell(row.row_id, field, event.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
