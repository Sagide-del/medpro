import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function Institutions() {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.institutionId) {
      api(`/institutions/${user.institutionId}`).then((d) => setInstitution(d.institution)).catch((e) => setError(e.message));
    }
  }, [user.institutionId]);

  if (error) return <div className="alert">{error}</div>;
  if (!institution) return <Loading label="Loading institution details…" />;

  return (
    <>
      <div className="page-head"><div><h1>{institution.name}</h1><div className="sub">Institution profile</div></div></div>
      <div className="card">
        <div className="form-grid">
          <div><label>Short code</label><p>{institution.short_code}</p></div>
          <div><label>Contact email</label><p>{institution.contact_email || '—'}</p></div>
          <div><label>Contact phone</label><p>{institution.contact_phone || '—'}</p></div>
          <div><label>Address</label><p>{institution.address || '—'}</p></div>
        </div>
      </div>
    </>
  );
}
