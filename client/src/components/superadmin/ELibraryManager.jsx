import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import { kes } from '../format';

export default function ELibraryManager() {

  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState('');

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
      .then((d)=>setResources(d.resources))
      .catch((e)=>setError(e.message));

  }


  useEffect(()=>{
    load();
  },[]);



  async function createResource(e){

    e.preventDefault();

    try{

      await api('/elibrary',{
        method:'POST',
        body:{
          ...form,
          publicationYear:Number(form.publicationYear) || null,
          price:Number(form.price)
        }
      });


      setForm({
        title:'',
        description:'',
        resourceType:'Peer-reviewed Article',
        category:'',
        author:'',
        journal:'',
        publicationYear:'',
        doi:'',
        externalUrl:'',
        learningObjectives:'',
        evidenceLevel:'',
        price:0
      });


      load();


    }catch(e){

      setError(e.message);

    }

  }





  async function uploadFile(id){

    const selected = files[id];


    if(!selected){

      alert('Please select a PDF first');
      return;

    }


    const data = new FormData();

    data.append('file',selected);


    setUploading(id);


    try{


      await api(`/elibrary/${id}/files`,{

        method:'POST',

        body:data

      });


      alert('PDF uploaded successfully');


      load();



    }catch(e){

      setError(e.message);


    }finally{

      setUploading('');

    }


  }





  async function publish(id){

    try{

      await api(`/elibrary/${id}/publish`,{

        method:'PATCH'

      });


      load();


    }catch(e){

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
            Upload clinical articles, guidelines and premium resources
          </div>

        </div>

      </div>




      <div className="card">

        <h2>Create Resource</h2>


        <form onSubmit={createResource} className="form-grid">


          <div className="field">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e)=>setForm({...form,title:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e)=>setForm({...form,description:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Resource Type</label>
            <input
              value={form.resourceType}
              onChange={(e)=>setForm({...form,resourceType:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Category</label>
            <input
              value={form.category}
              onChange={(e)=>setForm({...form,category:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Author</label>
            <input
              value={form.author}
              onChange={(e)=>setForm({...form,author:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Journal</label>
            <input
              value={form.journal}
              onChange={(e)=>setForm({...form,journal:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Publication Year</label>
            <input
              value={form.publicationYear}
              onChange={(e)=>setForm({...form,publicationYear:e.target.value})}
            />
          </div>



          <div className="field">
            <label>DOI</label>
            <input
              value={form.doi}
              onChange={(e)=>setForm({...form,doi:e.target.value})}
            />
          </div>



          <div className="field">
            <label>External URL</label>
            <input
              value={form.externalUrl}
              onChange={(e)=>setForm({...form,externalUrl:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Learning Objectives</label>
            <textarea
              value={form.learningObjectives}
              onChange={(e)=>setForm({...form,learningObjectives:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Evidence Level</label>
            <input
              value={form.evidenceLevel}
              onChange={(e)=>setForm({...form,evidenceLevel:e.target.value})}
            />
          </div>



          <div className="field">
            <label>Price KES</label>
            <input
              type="number"
              value={form.price}
              onChange={(e)=>setForm({...form,price:e.target.value})}
            />
          </div>



          <button className="primary">
            Create Resource
          </button>


        </form>

      </div>





      <div className="form-grid">


        {resources.map((r)=>(


          <div className="card" key={r.resource_id}>


            <h2>{r.title}</h2>


            <p>{r.description}</p>


            <p>
              <b>Type:</b> {r.resource_type}
            </p>


            <p>
              <b>Category:</b> {r.category}
            </p>


            <p>
              <b>Price:</b> {Number(r.price)>0 ? kes(r.price) : 'Free'}
            </p>




            <div className="field">

              <label>
                Upload PDF
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

              {
                uploading===r.resource_id
                ? 'Uploading...'
                : 'Upload PDF'
              }

            </button>



            <button

              className="ghost"

              style={{marginLeft:10}}

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