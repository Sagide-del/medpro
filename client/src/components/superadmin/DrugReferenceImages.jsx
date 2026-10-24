import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../../services/api';
import MasterContentItem from '../admin/MasterContentItem';
import './contentWorkspace.css';
export default function DrugReferenceImages(){
 const [items,setItems]=useState([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 async function load(){setError('');try{const data=await api('/ai/v2/master-content?contentType=drug_reference');setItems((data.content || []).filter(item=>item.destination_key==='drug_reference'));}catch(error){setError(error.message);}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 return <section className="page-stack drug-image-manager"><Link to="/superadmin/content">← Content Studio</Link><header className="content-workspace-intro"><span className="platform-eyebrow">Content management</span><h1>Drug reference images</h1><p>Attach a reviewed PNG, JPEG or WebP to a published reference. Match the medication and formulation, add a caption and credit, then upload. Generic illustrations remain the fallback.</p></header><label>Find a reference<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Medication or student track"/></label>{error && <p role="alert">{error}</p>}{loading?<p>Loading references…</p>:items.filter(item=>`${item.title} ${item.program}`.toLowerCase().includes(search.toLowerCase())).map(item=><MasterContentItem key={item.id} item={item} onChange={load}/>)}{!loading && !items.length && <p>No drug references have been published yet.</p>}</section>;
}
