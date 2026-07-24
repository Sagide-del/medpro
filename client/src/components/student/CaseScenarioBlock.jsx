function renderValue(value) {
  if (value == null) return null;
  if (typeof value === 'string') return <pre className="case-phase-body">{value}</pre>;
  if (Array.isArray(value)) {
    return (
      <div className="case-section-stack">
        {value.map((item, index) => (
          <div key={index}>{renderValue(item)}</div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="case-section-stack">
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className="case-section-item">
            <div className="case-section-label">{key.replace(/_/g, ' ')}</div>
            {renderValue(item)}
          </div>
        ))}
      </div>
    );
  }

  return <div className="case-phase-body">{String(value)}</div>;
}

function CaseDataTable({ table }) {
  if (!table?.columns?.length || !table?.rows?.length) return null;

  return (
    <div className="case-data-table-wrap">
      {table.title && <div className="case-table-title">{table.title}</div>}
      <div className="case-data-table-scroll">
        <table className="case-data-table">
          <thead>
            <tr>
              {table.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.title || 'row'}-${rowIndex}`}>
                {(row.cells || []).map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CaseScenarioBlock({ activity, patientTables = [] }) {
  const tables = [...(activity?.tables || []), ...patientTables];

  return (
    <div className="card case-activity-card">
      <div className="mcq-review-head">
        <div>
          <div className="case-section-kicker">{activity.phase}</div>
          <h2>{activity.title}</h2>
        </div>
        <span className="badge draft">Briefing</span>
      </div>

      {activity.content && <pre className="case-phase-body">{activity.content}</pre>}

      {tables.length > 0 && (
        <div className="case-table-stack">
          {tables.map((table, index) => (
            <CaseDataTable key={`${activity.id}-table-${index}`} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}

export { renderValue };
