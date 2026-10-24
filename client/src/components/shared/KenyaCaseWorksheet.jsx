import './kenyaCaseWorksheet.css';
function ReferenceAnswers({rows}) {
 if(!rows.length)return null;
 const same=new Set(rows.map(row=>row.hidden_answer)).size===1;
 return <div className="ke-reference"><h3>Reference answers</h3>{same?<p>{rows[0].hidden_answer}</p>:rows.map(row=><section key={row.row_key}><strong>{row.prompt}</strong><p>{row.hidden_answer || 'Discuss this response with your instructor.'}</p>{row.is_correct!==null && row.is_correct!==undefined && <small>{row.is_correct?'Matches the configured answer criteria':'Review against the configured answer criteria'}</small>}</section>)}</div>;
}
export default function KenyaCaseWorksheet({caseStudy,responses={},onChange,readOnly=false,review=[]}) {
 const doc=caseStudy;
 return <article className="ke-worksheet"><header className="ke-case-hero"><div className="ke-case-badges"><span>{doc.program}</span></div><h1>{doc.title}</h1>{doc.incident_year && <p>{doc.incident_year}</p>}</header>
 {doc.reported_facts && <section className="ke-brief"><h2>Incident</h2><p>{doc.reported_facts}</p></section>}
 {doc.scene_context && <section className="ke-brief"><h2>Scene</h2><p>{doc.scene_context}</p></section>}
 {Object.keys(doc.patient || {}).length>0 && <section className="ke-patient"><div><span className="ke-simulation-label">Simulated patient</span><h2>Presentation</h2></div><dl>{Object.entries(doc.patient).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{typeof value==='object'?JSON.stringify(value):String(value)}</dd></div>)}</dl></section>}

 {doc.tables.map((table,index)=><section className="ke-table-card" key={table.table_key}><header><span>{String(index+1).padStart(2,'0')}</span><div><h2>{table.title}</h2></div></header><div className="ke-table-scroll" tabIndex={0} aria-label={`${table.title} worksheet table`}><table><thead><tr><th scope="col">Assessment</th>{table.columns.map(column=><th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{table.rows.map(row=><tr key={row.row_key}><th scope="row">{row.prompt}{row.required && <span className="ke-required" aria-label="required"> *</span>}</th>{table.columns.map(column=><td key={column.key} data-label={column.label}><textarea aria-label={`${table.title}: ${row.prompt} — ${column.label}`} rows={3} maxLength={4000} required={row.required} readOnly={readOnly} value={responses[table.table_key]?.[row.row_key]?.[column.key] || ''} placeholder={readOnly?'—':'Your answer'} onChange={event=>onChange?.(table.table_key,row.row_key,column.key,event.target.value)} /></td>)}</tr>)}</tbody></table></div><ReferenceAnswers rows={review.filter(row=>row.table_key===table.table_key)}/></section>)}
 <footer className="ke-source"><strong>Source</strong><p>{doc.source || 'Source attribution is required before publication.'}</p><small>Educational simulation. Use current local protocols and the scope of your study track.</small></footer></article>;
}
