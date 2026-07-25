// 🩸 Editable vital-signs / triage entry table -- one row per patient, with an
// input cell for every scored column (e.g. HR, RR, BP, SpO2, GCS, Notes, or a
// triage Color / Priority / Rationale set, depending on the case). The row
// label carries the patient's presenting vitals exactly as given in the
// worksheet; only the remaining columns are editable by the student.
export default function VitalSignsTable({ title, table, value, onChange, points }) {
  const columns = table?.columns || [];
  const rows = table?.rows || [];
  const entryColumns = columns.slice(1);
  const currentRows = value?.rows || {};

  function updateCell(rowId, field, cellValue) {
    onChange({
      rows: {
        ...currentRows,
        [rowId]: {
          ...(currentRows[rowId] || {}),
          [field]: cellValue,
        },
      },
    });
  }

  if (!rows.length) return null;

  return (
    <div className="kems-vitals-table-wrap">
      {title && <div className="kems-vitals-table-title">{title}</div>}
      {Number.isFinite(points) && <div className="kems-points-badge">{points} pts</div>}
      <div className="kems-table-scroll">
        <table className="kems-table kems-table-entry">
          <thead>
            <tr>
              <th>{columns[0] || 'Patient'}</th>
              {entryColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.row_id}>
                <td className="kems-vitals-row-label">{row.label}</td>
                {(row.fields || []).map((field, fieldIndex) => (
                  <td key={`${row.row_id}-${field}`}>
                    <textarea
                      rows={2}
                      value={currentRows[row.row_id]?.[field] || ''}
                      placeholder={entryColumns[fieldIndex] || field}
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
