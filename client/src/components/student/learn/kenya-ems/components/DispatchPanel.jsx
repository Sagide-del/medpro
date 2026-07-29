import UiIcon from '../../../../shared/UiIcon';

export default function DispatchPanel({ text }) {
  if (!text) return null;

  return (
    <section className="kems-card kems-card-dispatch" aria-label="Dispatch information">
      <div className="kems-card-head">
        <span className="kems-card-icon" aria-hidden="true"><UiIcon name="dispatch" /></span>
        <span className="kems-card-label">Dispatch</span>
        <span className="kems-alert-chip" aria-hidden="true"><UiIcon name="alert" /> Live</span>
      </div>
      <pre className="kems-dispatch-text">{text}</pre>
    </section>
  );
}
