import {useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {api} from '../../services/api';
import UiIcon from '../shared/UiIcon';
import {clinicalHeading,clinicalText,clinicalBullets} from './drugReferenceFormat';
import './cheatSheets.css';

const inline=value=>String(value ?? '').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1');
function markdownTable(text){
 const lines=text.trim().split('\n').map(line=>line.trim());
 if(lines.length<3 || !lines[0].includes('|') || !/^\|?\s*:?-{3,}/.test(lines[1]))return null;
 const cells=line=>line.replace(/^\|/,'').replace(/\|$/,'').split('|').map(cell=>inline(cell.trim()));
 const headers=cells(lines[0]),separator=cells(lines[1]),rows=lines.slice(2).map(cells);
 if(headers.length<2 || separator.length!==headers.length || !separator.every(cell=>/^:?-{3,}:?$/.test(cell)) || rows.some(row=>row.length!==headers.length))return null;
 return {headers,rows};
}
function SheetBody({text,heading}){
 const blocks=String(text || '').split(/\n\s*\n/).filter(block=>block.trim());
 return blocks.map((block,index)=>{const table=markdownTable(block);if(table)return <div className="cs-table-wrap" key={index} tabIndex={0} aria-label={`${heading} table`}><table><thead><tr>{table.headers.map((cell,i)=><th scope="col" key={i}>{cell}</th>)}</tr></thead><tbody>{table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
 const lines=block.split(/\n+/).filter(line=>line.trim()),numbered=lines.map(line=>line.match(/^\s*(\d+)[.)]\s+(.*)$/));
 if(numbered.every(Boolean))return <ol className="cs-points" key={index}>{numbered.map((match,i)=><li key={i} value={Number(match[1])}>{inline(clinicalText(match[2]))}</li>)}</ol>;
 const points=numbered.some(Boolean)?lines.map(line=>inline(clinicalText(line.replace(/^\s*[-*•]\s+/,'')))):clinicalBullets(block).map(inline);
 return <ul className="cs-points" key={index}>{points.map((point,i)=><li key={i}>{point}</li>)}</ul>;});
}
export default function CheatSheets(){
 const {user}=useAuth(),[params,setParams]=useSearchParams(),selected=params.get('id');
 const [items,setItems]=useState([]),[search,setSearch]=useState(''),[topic,setTopic]=useState('All'),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');setItems([]);api('/published-content?destination=cheat_sheets').then(data=>{if(active)setItems(data.content || []);}).catch(error=>{if(active)setError(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[user?.program,retry]);
 const current=items.find(item=>item.id===selected),topics=['All',...new Set(items.map(item=>item.topic).filter(Boolean))];
 const visible=items.filter(item=>(topic==='All'||item.topic===topic)&&`${item.title} ${item.topic || ''} ${item.content_json?.summary || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.title.localeCompare(b.title));
 function open(id){setParams(id?{id}:{});window.scrollTo({top:0,behavior:'auto'});}
 const content=current?.content_json || {},sections=Array.isArray(content.sections)?content.sections.filter(section=>section?.heading && section?.text):[];
 return <div className="cheat-sheets"><header className="cs-page-heading"><div><span>{user?.program} · Revision</span><h1>Cheat Sheets</h1></div>{!current && !loading && <small>{items.length} sheets</small>}</header>{error && <div className="cs-empty" role="alert"><p>{error}</p><button onClick={()=>setRetry(value=>value+1)}>Try again</button></div>}{loading?<p role="status">Loading sheets…</p>:!error && (current?<>
 <div className="cs-reader-actions"><button onClick={()=>open(null)}>← All sheets</button><button onClick={()=>window.print()}><UiIcon name="document"/>Print / Save PDF</button></div><article className="cheat-sheet-reader"><header className="cs-sheet-heading"><div className="cs-sheet-meta"><span>MEDPROHUB</span><span>{user?.program} · {current.topic || 'Quick reference'}</span></div><h2>{inline(clinicalHeading(current.title))}</h2>{content.summary && <p>{inline(clinicalText(content.summary))}</p>}</header>{sections.length>1 && <nav className="cs-section-index" aria-label="Sheet sections">{sections.map((section,index)=><a key={index} href={`#cs-section-${index}`}>{clinicalHeading(section.heading)}</a>)}</nav>}<div className="cs-content-grid">{sections.map((section,index)=>{const heading=clinicalHeading(section.heading) || 'Key points',caution=/warning|precaution|contraindication|caution|avoid|red flag/i.test(heading);return <section className={`cs-section${caution?' cs-section-caution':''}`} id={`cs-section-${index}`} key={index}><h3><span className="cs-section-icon" aria-hidden="true"><UiIcon name={caution?'alert':'practice'}/></span>{heading}</h3><SheetBody text={section.text} heading={heading}/></section>;})}</div>{!sections.length && !content.summary && <p>No content is available for this sheet.</p>}<footer className="cs-reference"><strong>Reference</strong><p>{current.source_citation || 'Reference not provided.'}</p><small>Use current local protocols and your authorised scope.</small></footer></article>
 </>:<>{selected && <p role="status">This sheet is no longer available in your track.</p>}<div className="cs-filters"><label className="cs-search"><UiIcon name="search"/><span className="sr-only">Search cheat sheets</span><input type="search" placeholder="Search topic or title" value={search} onChange={event=>setSearch(event.target.value)}/></label><label className="cs-topic"><span className="sr-only">Topic</span><select aria-label="Topic" value={topic} onChange={event=>setTopic(event.target.value)}>{topics.map(value=><option key={value}>{value}</option>)}</select></label></div><div className="cs-library">{visible.map(item=><button className="cs-library-row" onClick={()=>open(item.id)} key={item.id}><span className="cs-paper-icon" aria-hidden="true"><UiIcon name="document"/></span><span className="cs-row-copy"><small>{clinicalHeading(item.topic || 'Quick reference')}</small><strong>{inline(clinicalHeading(item.title))}</strong></span><span className="cs-row-arrow" aria-hidden="true"><UiIcon name="arrowRight"/></span></button>)}</div>{!visible.length && <div className="cs-empty"><h2>{items.length?'No matches':'No cheat sheets yet'}</h2><p>{items.length?'Try another title or topic.':'Published sheets for your track will appear here.'}</p></div>}</>)}
 </div>;
}
