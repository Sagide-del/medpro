import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

function DeckList() {
  const [decks, setDecks] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/flashcards').then((d) => setDecks(d.decks)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!decks) return <Loading label="Loading flashcard decks…" />;

  return (
    <>
      <div className="page-head">
        <div><h1>Flashcards</h1><div className="sub">Ksh 10 per deck &middot; spaced repetition study mode</div></div>
      </div>
      <div className="form-grid">
        {decks.map((d) => (
          <Link key={d.deck_id} to={`/student/flashcards/${d.deck_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <h2>{d.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{d.description}</p>
              <span className="badge draft">{d.card_count} cards</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 600 }}>{kes(d.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function StudyDeck() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [dueCards, setDueCards] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api(`/flashcards/${id}`).then((d) => { setDeck(d.deck); setUnlocked(d.unlocked); });
  }
  useEffect(load, [id]);

  useEffect(() => {
    if (unlocked) api(`/flashcards/${id}/study/due`).then((d) => setDueCards(d.cards));
  }, [unlocked, id]);

  async function purchase() {
    setBusy(true); setStatus('');
    try {
      const res = await api('/payments/purchase', { method: 'POST', body: { itemType: 'flashcard_deck', itemId: id, phone } });
      setStatus(res.simulated ? 'Purchase simulated (dev mode) — access granted.' : 'Check your phone to complete the M-Pesa payment.');
      setTimeout(load, 1500);
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function rate(quality) {
    const card = dueCards[index];
    await api(`/flashcards/cards/${card.card_id}/review`, { method: 'POST', body: { quality } });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  if (!deck) return <Loading />;

  if (!unlocked) {
    return (
      <div className="card">
        <h1>{deck.title}</h1>
        <p style={{ margin: '10px 0' }}>{deck.description}</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="phone">M-Pesa phone number</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </div>
        </div>
        <button className="primary" onClick={purchase} disabled={busy || !phone}>
          {busy ? 'Processing…' : `Unlock for ${kes(deck.price)}`}
        </button>
        {status && <div className="ok-note">{status}</div>}
      </div>
    );
  }

  if (!dueCards) return <Loading />;

  if (index >= dueCards.length) {
    return (
      <div className="card">
        <h2>All caught up</h2>
        <p style={{ color: 'var(--ink-soft)' }}>No more cards due right now for "{deck.title}". Come back later — spaced repetition schedules cards based on how well you know them.</p>
      </div>
    );
  }

  const card = dueCards[index];
  return (
    <>
      <div className="page-head"><h1>{deck.title}</h1><div className="sub">Card {index + 1} of {dueCards.length} due</div></div>
      <div className={`flip-card${flipped ? ' flipped' : ''}`} onClick={() => setFlipped((f) => !f)} style={{ maxWidth: 480 }}>
        <div className="flip-card-inner">
          <div className="flip-card-face">{card.front}</div>
          <div className="flip-card-face flip-card-back">{card.back}</div>
        </div>
      </div>
      {!flipped ? (
        <button style={{ marginTop: 18 }} onClick={() => setFlipped(true)}>Show answer</button>
      ) : (
        <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
          <button className="danger" onClick={() => rate(1)}>Again</button>
          <button className="ghost" onClick={() => rate(3)}>Hard</button>
          <button onClick={() => rate(4)}>Good</button>
          <button className="primary" onClick={() => rate(5)}>Easy</button>
        </div>
      )}
    </>
  );
}

export default function Flashcards() {
  const { id } = useParams();
  return id ? <StudyDeck /> : <DeckList />;
}
