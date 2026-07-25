// 📡 Dispatch information panel -- reproduces the original worksheet's dispatch
// message box verbatim, preserving line breaks exactly as radioed/typed.
export default function DispatchPanel({ text }) {
  if (!text) return null;

  return (
    <section className="kems-card kems-card-dispatch" aria-label="Dispatch information">
      <div className="kems-card-head">
        <span className="kems-card-icon" aria-hidden="true">📡</span>
        <span className="kems-card-label">Dispatch</span>
        <span className="kems-alert-chip" aria-hidden="true">🚨 Live</span>
      </div>
      <pre className="kems-dispatch-text">{text}</pre>
    </section>
  );
}
