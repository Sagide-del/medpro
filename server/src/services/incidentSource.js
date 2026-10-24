import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import https from 'node:https';
import { ragError } from './ragService.js';

export function publicAddress(address) {
  if (isIP(address) === 6) return /^[23]/i.test(address) && !/^200[12]:/i.test(address) && !/^2001:db8:/i.test(address);
  if (isIP(address) !== 4) return false;
  const [a,b,c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 2))) ||
    (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0 && c === 113));
}
export function incidentUrl(value) {
  let url; try { url = new URL(value); } catch { throw ragError('Enter a valid HTTPS report URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw ragError('Use a public HTTPS report URL without credentials or a custom port.');
  return url;
}
export function reportText(html) {
  return html.replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'")
    .replace(/\s+/g,' ').trim();
}
export async function fetchIncidentReport(value, redirects = 0) {
  const url = incidentUrl(value);
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw ragError('This report URL does not resolve to a public website.');
  const pinned = addresses[0];
  const result = await new Promise((resolve,reject) => {
    const request = https.get(url, { headers: { Accept:'text/html,text/plain', 'User-Agent':'MedProHub-SourceImporter/1.0' },
      lookup: (_host, options, callback) => options.all ? callback(null,[pinned]) : callback(null,pinned.address,pinned.family) }, response => {
      if ([301,302,303,307,308].includes(response.statusCode)) {
        response.resume();
        if (!response.headers.location) { reject(ragError('Article redirect is incomplete. Paste the report text instead.',422)); return; }
        resolve({redirect:response.headers.location}); return;
      }
      if (response.statusCode !== 200 || !/text\/(html|plain)/i.test(response.headers['content-type'] || '')) {
        response.resume(); reject(ragError('This link could not be read as an article. Paste the report text instead.',422)); return;
      }
      let size=0; const chunks=[];
      response.on('data',chunk=>{size+=chunk.length;if(size>2_000_000) request.destroy(ragError('Article is too large. Paste the relevant report text.',422)); else chunks.push(chunk);});
      response.on('end',()=>resolve({text:reportText(Buffer.concat(chunks).toString('utf8')).slice(0,50000),url:url.href}));
      response.on('error',reject);
    });
    request.setTimeout(15000,()=>request.destroy(ragError('Article request timed out. Paste the report text instead.',422)));
    request.on('error',reject);
  });
  if (result.redirect) {
    if (redirects >= 3) throw ragError('Too many article redirects. Paste the report text instead.',422);
    return fetchIncidentReport(new URL(result.redirect,url).href,redirects+1);
  }
  return result;
}
