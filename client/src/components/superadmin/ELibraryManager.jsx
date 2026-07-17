import { useState } from 'react';
import { api } from '../../services/api';

export default function ELibraryManager() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    author: '',
    resourceType: 'ebook',
    journal: '',
    publicationYear: '',
    doi: '',
    externalUrl: '',
    learningObjectives: '',
    evidenceLevel: '',
    price: 0,
    isPremium: false,
  });

  const [status, setStatus] = useState('');

  function update(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  }

  async function submit(e) {
    e.preventDefault();
    setStatus('');

    try {
      await api('/elibrary', {
        method: 'POST',
        body: {
          ...form,
          publicationYear: form.publicationYear
            ? Number(form.publicationYear)
            : null,
          price: Number(form.price),
        },
      });

      setStatus('Resource created successfully.');

      setForm({
        title: '',
        description: '',
        category: '',
        author: '',
        resourceType: 'ebook',
        journal: '',
        publicationYear: '',
        doi: '',
        externalUrl: '',
        learningObjectives: '',
        evidenceLevel: '',
        price: 0,
        isPremium: false,
      });

    } catch (e) {
      setStatus(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>E-Library Manager</h1>
          <div className="sub">
            Add clinical articles, guidelines, and premium e-books
          </div>
        </div>
      </div>

      <form className="card" onSubmit={submit}>

        <div className="field">
          <label>Title</label>
          <input name="title" value={form.title} onChange={update} />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={update}/>
        </div>

        <div className="field">
          <label>Resource Type</label>
          <select name="resourceType" value={form.resourceType} onChange={update}>
            <option value="article">Peer-reviewed Article</option>
            <option value="guideline">Clinical Guideline</option>
            <option value="ebook">E-book</option>
            <option value="study_guide">Study Guide</option>
          </select>
        </div>

        <div className="field">
          <label>Category</label>
          <input
            name="category"
            placeholder="Trauma, BLS, Airway..."
            value={form.category}
            onChange={update}
          />
        </div>

        <div className="field">
          <label>Author</label>
          <input name="author" value={form.author} onChange={update}/>
        </div>

        <div className="field">
          <label>Journal</label>
          <input name="journal" value={form.journal} onChange={update}/>
        </div>

        <div className="field">
          <label>Publication Year</label>
          <input
            type="number"
            name="publicationYear"
            value={form.publicationYear}
            onChange={update}
          />
        </div>

        <div className="field">
          <label>DOI</label>
          <input name="doi" value={form.doi} onChange={update}/>
        </div>

        <div className="field">
          <label>External Source URL</label>
          <input name="externalUrl" value={form.externalUrl} onChange={update}/>
        </div>

        <div className="field">
          <label>Learning Objectives</label>
          <textarea
            name="learningObjectives"
            value={form.learningObjectives}
            onChange={update}
          />
        </div>

        <div className="field">
          <label>Evidence Level</label>
          <input
            name="evidenceLevel"
            placeholder="Systematic Review, Guideline, RCT..."
            value={form.evidenceLevel}
            onChange={update}
          />
        </div>

        <div className="field">
          <label>Price (KES)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={update}
          />
        </div>

        <label>
          <input
            type="checkbox"
            name="isPremium"
            checked={form.isPremium}
            onChange={update}
          />
          Premium resource
        </label>

        <button className="primary">
          Create Resource
        </button>

        {status && <div className="ok-note">{status}</div>}

      </form>
    </>
  );
}