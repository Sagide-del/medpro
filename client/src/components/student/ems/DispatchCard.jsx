// 📡 Dispatch information card -- reproduces the original worksheet's dispatch
// message box verbatim, preserving line breaks exactly as radioed/typed.
export default function DispatchCard({ text }) {
  if (!text) return null;

  return (
    <section className="ems-card ems-card-dispatch" aria-label="Dispatch information">
      <div className="ems-card-head">
        <span className="ems-card-icon" aria-hidden="true">📡</span>
        <span className="ems-card-label">Dispatch</span>
      </div>
      <pre className="ems-dispatch-text">{text}</pre>
    </section>
  );
}
