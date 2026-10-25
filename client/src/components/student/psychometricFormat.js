// Display-only removal of explicit generation commentary. Never rewrite case facts.
export function assessmentScenario(value){
 let text=String(value||'').replace(/\r\n?/g,'\n').trim();
 const framing=/^(?:(?:A|An|This)\s+source[- ](?:grounded|based|supported)\s+(?:(?:clinical|situational)\s+judg(?:e)?ment\s+)?(?:item|question|activity|exercise|assessment)\b|(?:This|The)\s+(?:item|question|activity|exercise)\s+(?:assesses|tests|focuses on|covers)\b)[^.!?\n]*(?:[.!?](?=\s|$)|(?=\n|$))/i;
 for(let count=0;count<4;count++){
  const match=text.match(framing);if(!match)break;
  // If an editorial sentence also contains findings or constraints, retain it.
  if(/\d|\b(?:patient|unresponsive|unconscious|supine|prone|breathless|bleeding|hypoxic|allerg(?:y|ic)|not|no|without|never)\b/i.test(match[0]))break;
  text=text.slice(match[0].length).trimStart();
 }
 return text.replace(/^(?:clinical\s+)?scenario\s*:\s*/i,'').trim();
}
export function listResponse(value,start,end,numbered=false){
 const first=value.lastIndexOf('\n',Math.max(0,start-1))+1;
 const next=value.indexOf('\n',end),last=next<0?value.length:next;
 const selected=value.slice(first,last).split('\n').map((line,index)=>`${numbered?`${index+1}.`:'•'} ${line}`).join('\n');
 return {value:value.slice(0,first)+selected+value.slice(last),start:first,end:first+selected.length};
}
