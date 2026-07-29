import UiIcon from '../../shared/UiIcon';

export default function DispatchCard({ text }) {
  if (!text) return null;

  return (
    <section className="ems-card ems-card-dispatch" aria-label="Dispatch information">
      <div className="ems-card-head">
        <span className="ems-card-icon" aria-hidden="true"><UiIcon name="dispatch" /></span>
        <span className="ems-card-label">Dispatch</span>
      </div>
      <pre className="ems-dispatch-text">{text}</pre>
    </section>
  );
}
