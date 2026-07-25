// 🩸 Read-only patient assessment table -- the incident's patient roster as
// given in the worksheet (Patient / Age-Sex / Presentation / Status, etc.),
// rendered as a bordered table rather than plain paragraphs.
export default function PatientAssessmentTable({ headers = [], rows = [] }) {
  if (!headers.length && !rows.length) return null;

  return (
    <section className="kems-card kems-card-patient-table" aria-label="Patient assessment">
      <div className="kems-card-head">
        <span className="kems-card-icon" aria-hidden="true">🩸</span>
        <span className="kems-card-label">Patient Assessment</span>
      </div>
      <div className="kems-table-scroll">
        <table className="kems-table kems-table-bordered">
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
