export default function Vital({ label, value, money, delta }) {
  return (
    <div className="vital">
      <div className="label">{label}</div>
      <div className={`value${money ? ' money' : ''}`}>{value}</div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  );
}
