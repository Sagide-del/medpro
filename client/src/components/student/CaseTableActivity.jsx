function renderPrompt(text) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <div key={index} className={line.trim() ? 'case-document-line' : 'case-document-line blank'}>
        {line || '\u00A0'}
      </div>
    ));
}

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
    <section className="case-block case-block-triage">
      <h3 className="case-question-heading">{activity.title}</h3>
      <div className="case-body-text">
        {renderPrompt(activity.prompt)}
      </div>

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
    </section>
  );
}
