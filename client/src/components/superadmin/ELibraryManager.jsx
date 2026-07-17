import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import { kes } from '../format';

export default function ELibraryManager() {

  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState('');

  function load() {
    api('/elibrary?status=draft')
      .then((d) => setResources(d.resources))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);


  async function publish(id) {
    try {
      await api(`/elibrary/${id}/publish`, {
        method: 'PATCH'
      });

      load();

    } catch (e) {
      setError(e.message);
    }
  }


  async function uploadFile(id) {

    const selected = files[id];

    if (!selected) {
      alert('Please select a PDF first');
      return;
    }


    const form = new FormData();

    form.append('file', selected);


    setUploading(id);


    try {

      await api(`/elibrary/${id}/files`, {
        method: 'POST',
        body: form
      });


      alert('PDF uploaded successfully');

      load();


    } catch(e) {

      setError(e.message);

    } finally {

      setUploading('');

    }

  }



  if(error)
    return <div className="alert">{error}</div>;


  if(!resources)
    return <Loading label="Loading E-library..." />;



  return (

    <>

    <div className="page-head">

      <div>

        <h1>E-Library Manager</h1>

        <div className="sub">
          Upload articles, guidelines and premium EMT resources
        </div>

      </div>

    </div>



    <div className="form-grid">


    {resources.map((r)=>(


      <div className="card" key={r.resource_id}>


        <h2>{r.title}</h2>


        <p>
          {r.description}
        </p>


        <p>
          <b>Type:</b> {r.resource_type}
        </p>


        <p>
          <b>Category:</b> {r.category}
        </p>


        <p>
          <b>Price:</b> {Number(r.price) > 0 ? kes(r.price) : "Free"}
        </p>



        <div className="field">

          <label>
            Upload PDF / Ebook
          </label>


          <input

            type="file"

            accept="application/pdf"

            onChange={(e)=>
              setFiles({
                ...files,
                [r.resource_id]:e.target.files[0]
              })
            }

          />

        </div>



        <button

          className="primary"

          disabled={uploading===r.resource_id}

          onClick={()=>uploadFile(r.resource_id)}

        >

          {uploading===r.resource_id
          ? "Uploading..."
          :"Upload PDF"}

        </button>



        <button

          style={{marginLeft:10}}

          className="ghost"

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