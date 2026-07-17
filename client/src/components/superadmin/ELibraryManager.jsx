import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import { kes } from '../format';

export default function ELibraryManager() {

  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'Peer-reviewed Article',
    category: '',
    author: '',
    journal: '',
    publicationYear: '',
    doi: '',
    externalUrl: '',
    learningObjectives: '',
    evidenceLevel: '',
    price: 0
  });


  function load() {
    api('/elibrary?status=draft')
      .then((d) => setResources(d.resources))
      .catch((e) => setError(e.message));
  }


  useEffect(() => {
    load();
  }, []);



  async function createResource(e) {

    e.preventDefault();

    setBusy(true);

    try {

      await api('/elibrary', {
        method: 'POST',
        body: {
          ...form,
          publicationYear: Number(form.publicationYear) || null,
          price: Number(form.price)
        }
      });


      setForm({
        title: '',
        description: '',
        resourceType: 'Peer-reviewed Article',
        category: '',
        author: '',
        journal: '',
        publicationYear: '',
        doi: '',
        externalUrl: '',
        learningObjectives: '',
        evidenceLevel: '',
        price: 0
      });


      load();


    } catch(e) {

      setError(e.message);

    } finally {

      setBusy(false);

    }

  }



  async function publish(id) {

    try {

      await api(`/elibrary/${id}/publish`, {
        method:'PATCH'
      });

      load();

    } catch(e) {

      setError(e.message);

    }

  }




  if(error)
    return <div className="alert">{error}</div>;


  if(!resources)
    return <Loading label="Loading E-Library..." />;




  return (

    <>

      <div className="page-head">
        <div>
          <h1>E-Library Manager</h1>
          <div className="sub">
            Add peer-reviewed articles, clinical guidelines and premium e-books
          </div>
        </div>
      </div>



      <div className="card">

        <h2>Create Resource</h2>


        <form onSubmit={createResource} className="form-grid">


          {[
            ['title','Title'],
            ['category','Category'],
            ['author','Author'],
            ['journal','Journal'],
            ['publicationYear','Publication Year'],
            ['doi','DOI'],
            ['externalUrl','External Source URL']
          ].map(([key,label])=>(

            <div className="field" key={key}>

              <label>{label}</label>

              <input
                value={form[key]}
                onChange={(e)=>
                  setForm({...form,[key]:e.target.value})
                }
              />

            </div>

          ))}



          <div className="field">

            <label>Description</label>

            <textarea
              value={form.description}
              onChange={(e)=>
                setForm({...form,description:e.target.value})
              }
            />

          </div>



          <div className="field">

            <label>Learning Objectives</label>

            <textarea
              value={form.learningObjectives}
              onChange={(e)=>
                setForm({...form,learningObjectives:e.target.value})
              }
            />

          </div>



          <div className="field">

            <label>Evidence Level</label>

            <input
              value={form.evidenceLevel}
              onChange={(e)=>
                setForm({...form,evidenceLevel:e.target.value})
              }
            />

          </div>



          <div className="field">

            <label>Price (KES)</label>

            <input
              type="number"
              value={form.price}
              onChange={(e)=>
                setForm({...form,price:e.target.value})
              }
            />

          </div>



          <button className="primary" disabled={busy}>

            {busy ? 'Creating...' : 'Create Resource'}

          </button>


        </form>

      </div>




      <div className="form-grid">


        {resources.map((r)=>(

          <div className="card" key={r.resource_id}>

            <h2>{r.title}</h2>

            <p>{r.description}</p>

            <p>
              <b>{r.resource_type}</b>
            </p>

            <p>
              {r.category}
            </p>


            <p>
              {Number(r.price)>0 ? kes(r.price) : 'Free'}
            </p>


            <button
              className="primary"
              onClick={()=>publish(r.resource_id)}
            >
              Publish
            </button>


          </div>


        ))}


      </div>


    </>

  );

}