import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, mediaUrl } from '../../services/api';
import UiIcon from '../shared/UiIcon';

export default function PublishedPodcasts() {
  const { user } = useAuth();
  const program = user?.program || 'EMT';
  const [episodes, setEpisodes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const audio = useRef(null);
  useEffect(() => {
    let active = true;
    setEpisodes([]); setSelected(null); setStatus(''); setLoading(true);
    api(`/published-content?program=${program}&destination=podcasts`)
      .then((data) => { if (active) { setEpisodes(data.content || []); setSelected(data.content?.[0]?.id || null); } })
      .catch((error) => { if (active) setStatus(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [program]);
  const current = episodes.find((episode) => episode.id === selected);
  const content = current?.content_json || {};
  const playable = content.media_type?.startsWith('audio/') && mediaUrl(content.media_url);
  return <>
    <div className="page-head podcast-page-head"><div><h1>Podcasts</h1><div className="sub">Audio reviews for {program} revision.</div></div><div className="podcast-page-count"><UiIcon name="activity" /><span>{episodes.length} episodes</span></div></div>
    {status && <p role="alert">{status}</p>}
    {loading && <p>Loading published episodes...</p>}
    {current && <section className="podcast-feature" aria-labelledby="podcast-title">
      <div className="podcast-feature-art" aria-hidden="true"><UiIcon name="activity" /><strong>EMS<br />Audio Review</strong></div>
      <div className="podcast-feature-content"><div className="podcast-kicker">{current.topic} / Module audio</div><h2 id="podcast-title">{current.title}</h2><p>{content.summary}</p>
        {playable ? <audio ref={audio} key={`${current.id}-${playable}`} src={playable} className="podcast-player" controls preload="metadata" onError={() => setStatus('Audio could not load. Refresh the library or contact your administrator.')} /> : <p>Transcript available. Audio has not been published yet.</p>}
        <div className="podcast-feature-actions"><details className="podcast-transcript"><summary><UiIcon name="document" />Transcript and key takeaways</summary><p style={{ whiteSpace: 'pre-wrap' }}>{content.transcript || content.sections?.map((section) => `${section.heading}\n${section.text}`).join('\n\n') || 'No transcript published.'}</p>{current.source_citation && <p>Source: {current.source_citation}</p>}</details>
          <button type="button" disabled={!playable} className="new-button new-button-primary" onClick={() => audio.current?.play().catch(() => setStatus('Press play on the audio controls to begin.'))}>Continue listening <UiIcon name="arrowRight" /></button>
        </div>
      </div>
    </section>}
    <section className="podcast-library"><div className="podcast-library-head"><div><div className="podcast-kicker">Module library</div><h2>Audio revision by module</h2><p>Select a published episode to reinforce your learning.</p></div><span className="podcast-view-toggle"><UiIcon name="learn" />{episodes.length} episodes</span></div>
      <div className="podcast-list">{episodes.map((episode, index) => <button type="button" className={episode.id === selected ? 'is-selected' : ''} key={episode.id} onClick={() => { setSelected(episode.id); setStatus(''); }}><span className="podcast-list-number">{String(index + 1).padStart(2, '0')}</span><span className="podcast-list-copy"><strong>{episode.title}</strong><small>{episode.topic} / {episode.content_json.summary}</small></span><span className="podcast-list-action">{episode.content_json.media_url ? 'Listen' : 'Read transcript'} <UiIcon name="arrowRight" /></span></button>)}</div>
      {!loading && !episodes.length && <p>No {program} podcast content has been published yet.</p>}
    </section>
  </>;
}
