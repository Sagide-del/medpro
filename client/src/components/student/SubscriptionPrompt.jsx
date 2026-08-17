export default function SubscriptionPrompt({ subscription, title = 'Subscription required' }) {
  const plan = subscription?.plan;
  const expiry = subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('en-KE') : 'Not active';
  const features = subscription?.premiumFeatures || plan?.features || [];

  return (
    <div className="card">
      <h2>{title}</h2>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>
        MedProHub Student Plan renews at KES 150/month via Tatua Till 4382411.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className={`badge ${subscription?.status === 'active' ? 'approved' : subscription?.status === 'pending' ? 'draft' : 'rejected'}`}>
          {subscription?.status || 'expired'}
        </span>
        <span className="badge draft">{plan?.currency || 'KES'} {Number(plan?.price || 150).toLocaleString('en-KE')}/month</span>
        <span className="badge draft">Expiry: {expiry}</span>
        <span className="badge draft">Till 4382411</span>
      </div>
      <ul style={{ paddingLeft: 18, marginBottom: 14 }}>
        {features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      <a className="primary" href="/student/subscription">Open subscription page</a>
    </div>
  );
}
