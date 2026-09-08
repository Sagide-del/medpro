import { StudentNote } from '../models/StudentNote.js';
import { asyncHandler } from '../utils/helpers.js';

export const listNotes = asyncHandler(async (req, res) => {
  res.json({ notes: await StudentNote.list(req.user.sub) });
});

export const createNote = asyncHandler(async (req, res) => {
  const { title, body, topic } = req.body || {};
  if (!String(title || '').trim() || !String(body || '').trim()) {
    return res.status(400).json({ error: 'Title and note content are required.' });
  }
  res.status(201).json({ note: await StudentNote.create(req.user.sub, { title: title.trim(), body: body.trim(), topic }) });
});

export const updateNote = asyncHandler(async (req, res) => {
  const { title, body, topic } = req.body || {};
  const note = await StudentNote.update(req.user.sub, req.params.id, { title: String(title || '').trim(), body: String(body || '').trim(), topic });
  if (!note) return res.status(404).json({ error: 'Note not found.' });
  res.json({ note });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const deleted = await StudentNote.delete(req.user.sub, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Note not found.' });
  res.status(204).end();
});
