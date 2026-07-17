import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';


function ResourceList() {

  const [resources, setResources] = useState(null);
  const [error, setError] = useState('');


  useEffect(() => {

    api('/elibrary')
      .then((d)=>setResources(d.resources))
      .catch((e)=>setError(e.message));

  }, []);



  if(error)
    return <div className="alert">{error}</div>;


  if(!resources)
    return <Loading label="Loading clinical library..." />;



  return (

    <>

      <div className="page-head">

        <div>

          <h1>E-Library</h1>

          <div className="sub">
            Evidence-based articles, EMT guidelines and clinical resources
          </div>

        </div>

      </div>



      <div className="form-grid">


        {resources.map((r)=>(


          <Link
            key={r.resource_id}
            to={`/student/elibrary/${r.resource_id}`}
            style={{textDecoration:'none'}}
          >


            <div className="card">


              <h2>{r.title}</h2>


              <p>
                {r.description}
              </p>



              <span className="badge draft">

                {r.resource_type}

              </span>



              <p style={{marginTop:10}}>

                <b>Category:</b> {r.category}

              </p>



              {r.journal && (

                <p>

                  <b>Journal:</b> {r.journal}

                </p>

              )}



              {r.publication_year && (

                <p>

                  <b>Year:</b> {r.publication_year}

                </p>

              )}



              <strong>

                {Number(r.price)>0
                  ? kes(r.price)
                  : 'Free'}

              </strong>


            </div>


          </Link>


        ))}



        {resources.length===0 && (

          <p>No published resources available.</p>

        )}


      </div>


    </>

  );

}





function ResourceDetail() {


  const {id}=useParams();

  const [resource,setResource]=useState(null);
  const [unlocked,setUnlocked]=useState(false);
  const [phone,setPhone]=useState('');
  const [status,setStatus]=useState('');



  function load(){

    api(`/elibrary/${id}`)
      .then((d)=>{

        setResource(d.resource);
        setUnlocked(d.unlocked);

      });

  }



  useEffect(load,[id]);




  async function purchase(){

    try{

      const res=await api('/payments/purchase',{

        method:'POST',

        body:{

          itemType:'elibrary_resource',

          itemId:id,

          phone

        }

      });


      setStatus(

        res.simulated
        ? 'Unlocked successfully.'
        : 'Complete payment on your phone.'

      );


      setTimeout(load,1500);


    }catch(e){

      setStatus(e.message);

    }

  }





  if(!resource)
    return <Loading />;




  const free=Number(resource.price)<=0;



  return (

    <>


      <div className="page-head">

        <h1>{resource.title}</h1>

      </div>



      <div className="card">


        <p>
          {resource.description}
        </p>



        {resource.author && (

          <p>
            <b>Author:</b> {resource.author}
          </p>

        )}



        {resource.journal && (

          <p>
            <b>Journal:</b> {resource.journal}
          </p>

        )}



        {resource.doi && (

          <p>
            <b>DOI:</b> {resource.doi}
          </p>

        )}



        {resource.evidence_level && (

          <p>
            <b>Evidence:</b> {resource.evidence_level}
          </p>

        )}




        {free || unlocked ? (

          resource.file_url ? (

            <a
              href={resource.file_url}
              target="_blank"
              rel="noreferrer"
            >

              <button className="primary">
                Open Resource
              </button>

            </a>

          ) : resource.external_url ? (

            <a
              href={resource.external_url}
              target="_blank"
              rel="noreferrer"
            >

              <button className="primary">
                View Article
              </button>

            </a>


          ) : (

            <p>
              Resource file not available yet.
            </p>

          )


        ) : (

          <>

            <input

              placeholder="M-Pesa phone number"

              value={phone}

              onChange={(e)=>setPhone(e.target.value)}

            />


            <button

              className="primary"

              onClick={purchase}

            >

              Unlock {kes(resource.price)}

            </button>


          </>

        )}



        {status && (

          <div className="ok-note">

            {status}

          </div>

        )}



      </div>


    </>

  );

}





export default function ELibrary(){

  const {id}=useParams();

  return id
    ? <ResourceDetail/>
    : <ResourceList/>;

}