# Podcast Studio

Console: `/superadmin/podcast-studio`. Student library: `/student/videos`.

The eight supplied EMT scripts are packaged as MP3s and transcripts. They use
Microsoft Asilia (`en-KE-AsiliaNeural`), a female Kenyan English voice, at -8%
rate and -2 Hz pitch. Durations are measured from the recordings, rather than
estimated from script headings. Stage directions and Markdown emphasis are
not spoken; the supplied clinical wording is retained.

## Creating episodes

1. Open Podcast Studio and select New episode.
2. Set title, topic, enrolled track and female African English voice.
3. Paste a script or upload one `.txt` / `.md` file (up to 25,000 script characters).
4. Save draft, then Convert to audio. The persisted queue continues after navigation.
5. Listen to the recording and review the clinical script, then publish it.

Existing episodes remain in the library. Unpublish hides an episode from the
student feed. Saving changes to an existing episode makes it a new draft and
invalidates its old recording. Conflicting edits and edits during conversion
are rejected. Failed conversions can be retried without recreating the episode.

## Deployment

Deploy both `client` and `server`. The client includes the eight starter
recordings, so they remain usable with an older backend. The studio's editing
and conversion endpoints require the new backend. On API availability the
server's publication state is authoritative, including withdrawn starter episodes.

The server Dockerfile installs Python and the pinned Edge TTS dependency. No
voice key is required for the default provider. For development, install
`server/podcast-requirements.txt` in a Python environment and optionally set
`PODCAST_PYTHON_BIN` to that interpreter's absolute path.

New recordings are stored as binary MP3 data in Postgres, alongside scripts
and queue state. No ephemeral upload disk or separate storage key is required.
Individual episodes are capped at 12 MB. Native range requests support seeking;
studio previews and new published audio use scoped, expiring media links.
The eight original MP3s are packaged static educational assets.

`PODCAST_TTS_PROVIDER=edge` is the default unless Azure Speech is configured.
For a supported commercial speech service, set `PODCAST_TTS_PROVIDER=azure`,
`AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` on the server only. The same
Asilia voice and gentle delivery settings are used. Keys never reach the browser.
The Edge provider depends on the public speech service and can be rate limited;
conversion failures stay as retriable drafts, never silent published episodes.

## Verification

Client build and catalog tests validate the eight assets, matching catalogs,
transcripts and measured durations. Database tests exercise role/track access,
idempotent saves, queueing, recording storage, signed previews, range playback,
publication, withdrawal, stale edits and failed-conversion retry state.
