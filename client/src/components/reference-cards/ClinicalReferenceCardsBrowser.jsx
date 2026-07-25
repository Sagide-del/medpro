import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import SubscriptionPrompt from '../student/SubscriptionPrompt';

const MODE_META = {
  student: {
    title: 'Clinical Reference Cards',
    subtitle: 'Browse PDF reference cards by category and open the document in your browser.',
  },
  teacher: {
    title: 'Clinical Reference Cards',
    subtitle: 'View published PDF reference cards for your program scope.',
  },
  admin: {
    title: 'Clinical Reference Cards',
    subtitle: 'Manage institution PDF reference cards by category.',
  },
};

function normalizeCategory(card) {
  return card?.category || card?.module || 'Uncategorised';
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function openDocument(url, onError) {
  if (!url) {
    if (onError) onError('This PDF is not available right now. Try refreshing the page.');
    return;
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened && onError) {
    onError('Your browser blocked the PDF from opening in a new tab. Allow pop-ups for this site and try again.');
  }
}

function PdfModal({ card, onClose }) {
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameError, setFrameError] = useState('');

  useEffect(() => {
    setFrameLoading(Boolean(card?.pdf_url));
    setFrameError(card?.pdf_url ? '' : 'This PDF is not available right now. Try refreshing the page.');
  }, [card]);

  if (!card) return null;

  return (
    <div className="ref-card-modal" role="dialog" aria-modal="true" aria-label={card.title} onClick={onClose}>
      <div className="ref-card-modal-panel ref-card-pdf-panel" onClick={(event) => event.stopPropagation()}>
        <div className="ref-card-modal-head">
          <div>
            <div className="ref-card-kicker">{normalizeCategory(card)}</div>
            <h2>{card.title}</h2>
            <div className="ref-card-modal-meta">
              <span>{card.difficulty || 'intermediate'}</span>
              {card.file_type ? <span>{card.file_type.toUpperCase()}</span> : null}
              {card.created_at ? <span>{formatDate(card.created_at)}</span> : null}
            </div>
          </div>
          <div className="ref-card-modal-actions">
            <button
              className="ghost"
              onClick={() => openDocument(card.pdf_url, setFrameError)}
              disabled={!card.pdf_url}
            >
              Open in new tab
            </button>
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="ref-card-pdf-frame-wrap">
          {frameError ? (
            <div className="ref-card-image-fallback">
              <span>{frameError}</span>
            </div>
          ) : (
            <>
              {frameLoading && (
                <div className="ref-card-image-loading">
                  <span>Loading PDF…</span>
                </div>
              )}
              <iframe
                title={card.title}
                src={card.pdf_url}
                className="ref-card-pdf-frame"
                style={frameLoading ? { display: 'none' } : undefined}
                onLoad={() => setFrameLoading(false)}
                onError={() => {
                  setFrameLoading(false);
                  setFrameError('This PDF failed to load. Try again or open it in a new tab.');
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CardRow({ card, onOpen }) {
  const [openError, setOpenError] = useState('');
  return (
    <div className="ref-card-document-row">
      <div className="ref-card-document-main">
        <div className="ref-card-kicker">{normalizeCategory(card)}</div>
        <h3>{card.title}</h3>
        <div className="ref-card-document-meta">
          <span>{card.difficulty || 'intermediate'}</span>
          {card.file_type ? <span>{card.file_type.toUpperCase()}</span> : null}
          {card.created_at ? <span>{formatDate(card.created_at)}</span> : null}
        </div>
        {openError && <div className="error-note">{openError}</div>}
      </div>
      <div className="ref-card-document-actions">
        <button
          className="primary"
          onClick={onOpen}
          disabled={!card.pdf_url}
          title={!card.pdf_url ? 'PDF is not available right now.' : undefined}
        >
          Open Reference Card
        </button>
        <button
          className="ghost"
          onClick={() => openDocument(card.pdf_url, setOpenError)}
          disabled={!card.pdf_url}
          title={!card.pdf_url ? 'PDF is not available right now.' : undefined}
        >
          Open in new tab
        </button>
      </div>
    </div>
  );
}

function CardBrowser({ mode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  const [viewerCard, setViewerCard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    const params = new URLSearchParams();
    if (mode === 'admin') params.set('status', 'published');

    api(`/clinical-reference-cards${params.toString() ? `?${params.toString()}` : ''}`)
      .then((data) => setCards(data.cards || []))
      .catch((err) => {
        if (err.code === 'SUBSCRIPTION_REQUIRED') {
          setSubscription(err.subscription);
          setCards([]);
          setError('');
          return;
        }
        setError(err.message);
      });
  }, [mode]);

  const meta = MODE_META[mode] || MODE_META.student;
  const categories = useMemo(() => {
    const bucket = new Map();
    (cards || []).forEach((card) => {
      const category = normalizeCategory(card);
      if (!bucket.has(category)) bucket.set(category, []);
      bucket.get(category).push(card);
    });
    return [...bucket.entries()].map(([category, items]) => ({ category, items }));
  }, [cards]);

  const activeCards = useMemo(() => {
    if (!selectedCategory) return [];
    return categories.find((entry) => entry.category === selectedCategory)?.items || [];
  }, [categories, selectedCategory]);

  useEffect(() => {
    const queryCategory = searchParams.get('category') || '';
    if (queryCategory && queryCategory !== selectedCategory) setSelectedCategory(queryCategory);
    if (!queryCategory && selectedCategory) setSelectedCategory('');
  }, [searchParams, selectedCategory]);

  useEffect(() => {
    if (!cards || !id) return;
    const found = cards.find((card) => String(card.clinical_card_id || card.id) === String(id));
    if (found) {
      const category = normalizeCategory(found);
      setSelectedCategory(category);
      setSearchParams({ category });
      setViewerCard(found);
    }
  }, [cards, id, setSearchParams]);

  if (error) return <div className="alert">{error}</div>;
  if (subscription && mode === 'student') return <SubscriptionPrompt subscription={subscription} title="Subscription required for Clinical Reference Cards" />;
  if (!cards) return <Loading label="Loading clinical reference cards..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{meta.title}</h1>
          <div className="sub">{meta.subtitle}</div>
        </div>
        {selectedCategory && (
          <button
            className="ghost"
            onClick={() => {
              setSelectedCategory('');
              setSearchParams({});
              navigate(location.pathname, { replace: true });
            }}
          >
            Back to categories
          </button>
        )}
      </div>

      {!selectedCategory ? (
        <div className="ref-card-category-grid">
          {categories.map((entry) => (
            <button
              key={entry.category}
              className="ref-card-category-card ref-card-category-card--doc"
              onClick={() => {
                setSelectedCategory(entry.category);
                setSearchParams({ category: entry.category });
              }}
            >
              <div className="ref-card-category-body">
                <div className="ref-card-kicker">Category</div>
                <h2>{entry.category}</h2>
                <p>{entry.items.length} card{entry.items.length === 1 ? '' : 's'}</p>
              </div>
            </button>
          ))}
          {categories.length === 0 && <div className="card"><p style={{ marginBottom: 0 }}>No clinical reference cards have been uploaded yet.</p></div>}
        </div>
      ) : (
        <>
          <div className="ref-card-section-head">
            <div>
              <div className="ref-card-kicker">Category</div>
              <h2>{selectedCategory}</h2>
            </div>
            <div className="ref-card-section-meta">{activeCards.length} card{activeCards.length === 1 ? '' : 's'}</div>
          </div>
          <div className="ref-card-document-list">
            {activeCards.map((card) => (
              <CardRow
                key={card.clinical_card_id || card.id}
                card={card}
                onOpen={() => setViewerCard(card)}
              />
            ))}
          </div>
        </>
      )}

      {viewerCard && (
        <PdfModal card={viewerCard} onClose={() => setViewerCard(null)} />
      )}
    </>
  );
}

export default function ClinicalReferenceCardsBrowser({ mode = 'student' }) {
  return <CardBrowser mode={mode} />;
}
