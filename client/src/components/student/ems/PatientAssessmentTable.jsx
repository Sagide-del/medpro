// 🩸 Read-only patient assessment table -- the incident's patient roster as
// given in the worksheet (Patient / Age-Sex / Presentation / Status, etc.),
// rendered as a bordered HTML table rather than plain paragraphs.
export default function PatientAssessmentTable({ headers = [], rows = [] }) {
  if (!headers.length && !rows.length) return null;

  return (
    <section className="ems-card ems-card-patient-table" aria-label="Patient assessment">
      <div className="ems-card-head">
        <span className="ems-card-icon" aria-hidden="true">🩸</span>
        <span className="ems-card-label">Patient Assessment</span>
      </div>
      <div className="ems-table-scroll">
        <table className="ems-table ems-table-bordered">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`patient-header-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`patient-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`patient-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
