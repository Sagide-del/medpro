function renderPlainLines(text) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <div key={index} className={line.trim() ? 'case-document-line' : 'case-document-line blank'}>
        {line || '\u00A0'}
      </div>
    ));
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

export default function CaseScenarioBlock({ activity, patientTables = [], kind = 'scenario_block' }) {
  const tables = [...(activity?.tables || []), ...patientTables];
  const lines = String(activity.content || '').split('\n');
  const normalizedTitle = String(activity.title || '').trim().toLowerCase();
  const normalizedFirstLine = String(lines[0] || '').trim().toLowerCase();
  const content = normalizedFirstLine === normalizedTitle ? lines.slice(1).join('\n').trimStart() : activity.content;

  return (
    <section className={`case-block case-block-${kind}`}>
      <div className="case-body-text">
        {renderPlainLines(content)}
      </div>

      {tables.length > 0 && (
        <div className="case-table-stack">
          {tables.map((table, index) => (
            <CaseDataTable key={`${activity.id}-table-${index}`} table={table} />
          ))}
        </div>
      )}
    </section>
  );
}
