import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import SubscriptionPrompt from '../student/SubscriptionPrompt';

const MODE_META = {
  student: {
    title: 'Clinical Reference Cards',
    subtitle: 'Browse PNG reference cards by category and open the original image.',
  },
  teacher: {
    title: 'Clinical Reference Cards',
    subtitle: 'View published cards assigned to your program scope.',
  },
  admin: {
    title: 'Clinical Reference Cards',
    subtitle: 'View institution cards by category.',
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

function ImageViewer({ cards, index, onClose, onChange }) {
  const card = cards[index];
  const touchStart = useRef(null);

  if (!card) return null;

  function move(direction) {
    const nextIndex = (index + direction + cards.length) % cards.length;
    onChange(nextIndex);
  }

  return (
    <div className="ref-card-modal" role="dialog" aria-modal="true" aria-label={card.title} onClick={onClose}>
      <div
        className="ref-card-modal-panel"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          if (start == null) return;
          const end = event.changedTouches[0].clientX;
          const delta = end - start;
          if (Math.abs(delta) > 42) move(delta < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        <div className="ref-card-modal-head">
          <div>
            <div className="ref-card-kicker">{normalizeCategory(card)}</div>
            <h2>{card.title}</h2>
            <div className="ref-card-modal-meta">
              <span>{card.difficulty || 'intermediate'}</span>
              <span>{index + 1} of {cards.length}</span>
              {card.created_at ? <span>{formatDate(card.created_at)}</span> : null}
            </div>
          </div>
          <div className="ref-card-modal-actions">
            <button className="ghost" onClick={() => move(-1)} disabled={cards.length <= 1}>Prev</button>
            <button className="ghost" onClick={() => move(1)} disabled={cards.length <= 1}>Next</button>
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="ref-card-modal-image-wrap">
          <img src={card.image_url || card.file_url} alt={card.title} className="ref-card-modal-image" />
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ card, onOpen }) {
  return (
    <button className="ref-card-gallery-card" onClick={onOpen}>
      <div className="ref-card-gallery-image-wrap">
        <img src={card.image_url || card.file_url} alt={card.title} className="ref-card-gallery-image" />
      </div>
      <div className="ref-card-gallery-body">
        <div className="ref-card-kicker">{normalizeCategory(card)}</div>
        <h3>{card.title}</h3>
        <div className="ref-card-gallery-meta">
          <span>{card.difficulty || 'intermediate'}</span>
          <span>{formatDate(card.created_at)}</span>
        </div>
      </div>
    </button>
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
  const [viewerIndex, setViewerIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    const params = new URLSearchParams();
    if (mode === 'admin') {
      params.set('status', 'published');
    }
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
    if (!queryCategory && selectedCategory) {
      setSelectedCategory('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!cards || !id) return;
    const found = cards.find((card) => String(card.clinical_card_id || card.id) === String(id));
    if (found) {
      const category = normalizeCategory(found);
      setSelectedCategory(category);
      setSearchParams({ category });
      const list = categories.find((entry) => entry.category === category)?.items || [];
      const nextIndex = list.findIndex((item) => String(item.clinical_card_id || item.id) === String(found.clinical_card_id || found.id));
      setViewerIndex(nextIndex >= 0 ? nextIndex : 0);
    }
  }, [cards, id]);

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
          {categories.map((entry) => {
            const preview = entry.items[0];
            return (
              <button
                key={entry.category}
                className="ref-card-category-card"
                onClick={() => {
                  setSelectedCategory(entry.category);
                  setSearchParams({ category: entry.category });
                }}
              >
                <div className="ref-card-category-preview">
                  {preview?.image_url || preview?.file_url ? (
                    <img src={preview.image_url || preview.file_url} alt={entry.category} />
                  ) : (
                    <span>{entry.category}</span>
                  )}
                </div>
                <div className="ref-card-category-body">
                  <div className="ref-card-kicker">Category</div>
                  <h2>{entry.category}</h2>
                  <p>{entry.items.length} card{entry.items.length === 1 ? '' : 's'}</p>
                </div>
              </button>
            );
          })}
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
          <div className="ref-card-gallery-grid">
            {activeCards.map((card, index) => (
              <GalleryCard
                key={card.clinical_card_id || card.id || `${card.title}-${index}`}
                card={card}
                onOpen={() => setViewerIndex(index)}
              />
            ))}
          </div>
        </>
      )}

      {viewerIndex != null && activeCards[viewerIndex] && (
        <ImageViewer
          cards={activeCards}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onChange={setViewerIndex}
        />
      )}
    </>
  );
}

export default function ClinicalReferenceCardsBrowser({ mode = 'student' }) {
  return <CardBrowser mode={mode} />;
}
