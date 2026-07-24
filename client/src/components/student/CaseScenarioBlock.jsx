function renderPlainLines(text) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <div key={index} className={line.trim() ? 'case-document-line' : 'case-document-line blank'}>
        {line || '\u00A0'}
      </div>
    ));
}

function parseStatisticsRows(text) {
  const lines = String(text || '').split('\n');
  const statsIndex = lines.findIndex((line) => line.trim().toLowerCase() === 'incident statistics:');
  if (statsIndex === -1) {
    return { body: text, rows: [] };
  }

  const before = lines.slice(0, statsIndex + 1);
  const after = [];
  const stats = [];
  let collectingStats = true;

  for (let index = statsIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (collectingStats && !trimmed) {
      if (stats.length > 0) {
        collectingStats = false;
        after.push(line);
      }
      continue;
    }

    if (collectingStats) {
      stats.push(trimmed);
      continue;
    }

    after.push(line);
  }

  const rows = stats
    .filter(Boolean)
    .map((item) => {
      if (item.includes(':')) {
        const [label, ...rest] = item.split(':');
        return { label: label.trim(), value: rest.join(':').trim() };
      }
      return { label: 'Statistic', value: item };
    });

  return {
    body: [...before, ...after].join('\n').trimEnd(),
    rows,
  };
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
  const { body, rows } = parseStatisticsRows(content);

  return (
    <section className={`case-block case-block-${kind}`}>
      <div className="case-body-text">
        {renderPlainLines(body)}
      </div>

      {rows.length > 0 && (
        <div className="case-data-table-wrap">
          <div className="case-table-title">Incident Statistics</div>
          <div className="case-data-table-scroll">
            <table className="case-data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${activity.id}-stat-${index}`}>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
