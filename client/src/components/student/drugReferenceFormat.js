// Display-only cleanup. Evidence and stored clinical content remain unchanged.
export function clinicalHeading(value){
 const heading=String(value || '').replace(/^(?:the\s+)?source[- ](?:listed|supported|based)\s+/i,'').replace(/\(\s*source[- ](?:listed|supported|based)\s*\)/gi,'').replace(/\bsource[- ](?:listed|supported|based)\b\s*/gi,'').replace(/^(?:the\s+)?source(?:['’]?s)?\s+/i,'').trim().replace(/^(?:dosage|dosing)\s+(?:and|&)\s+administration$/i,'Dose & administration');
 return heading.charAt(0).toUpperCase()+heading.slice(1);
}
export function clinicalText(value){
 const text=String(value || '').replace(/\b(?:According to|As described in|As listed in) the source,?\s*/gi,'').replace(/\bThe source (?:lists|describes|states|indicates|notes|specifies) (?:the following\s+)?(?:that\s+)?/gi,'');
 return text.replace(/\bsource[- ](?:supported|listed|based)\s+/gi,(match,offset)=>{
  const before=text.slice(Math.max(text.lastIndexOf('.',offset-1),text.lastIndexOf('\n',offset-1))+1,offset);
  return /\b(?:not|no|never|without)\b|non-$/i.test(before)?match:'';
 }).replace(/(^|[.!?]\s+)([a-z])/g,(_,prefix,letter)=>prefix+letter.toUpperCase()).trim();
}
export function clinicalBullets(value){
 const text=clinicalText(value);if(!text)return [];
 // Preserve order, numerical values, units and semicolon-linked qualifications.
 const lines=text.split(/\n+/).map(line=>line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/,'').trim()).filter(Boolean);
 return lines.flatMap(line=>line.split(/(?<=[.!?])\s+(?=[A-Z])/)).filter(Boolean);
}
export const isBulletSection=heading=>/dosage|\bdose\b|dosing|administration|\broute\b|indication|contraindication|precaution|adverse|monitoring|warning|caution/i.test(heading);
