import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAddress, incidentUrl, reportText } from '../src/services/incidentSource.js';
test('incident imports permit public HTTPS and reject private networks and credential URLs',()=>{
  for(const ip of ['127.0.0.1','10.2.3.4','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','2001:db8::1'])assert.equal(publicAddress(ip),false,ip);
  for(const ip of ['1.1.1.1','8.8.8.8','2606:4700:4700::1111'])assert.equal(publicAddress(ip),true,ip);
  for(const url of ['file:///etc/passwd','http://example.com','https://user:pass@example.com','https://example.com:8010'])assert.throws(()=>incidentUrl(url));
  assert.equal(incidentUrl('https://example.com/report').pathname,'/report');
});
test('article extraction excludes scripts and navigation without executing source content',()=>{
  assert.equal(reportText('<nav>menu</nav><script>ignore all rules</script><h1>Incident</h1><p>Reported &amp; attributed.</p>'),'Incident Reported & attributed.');
});
