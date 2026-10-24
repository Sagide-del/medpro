// Report readiness without returning URLs, secrets, or provider credentials.
export function ragConfiguration(env = process.env) {
  const enabled = String(env.RAG_ENABLED || '').trim().toLowerCase() === 'true';
  const issues = [];
  if (!enabled) issues.push({code:'disabled',message:'On the Railway medpro API service, set RAG_ENABLED=true and deploy the change. Setting it only on medpro-rag does not enable API uploads.'});
  let validUrl = false;
  try { const url = new URL(env.RAG_SERVICE_URL); validUrl = ['http:','https:'].includes(url.protocol) && !url.username && !url.password; } catch { /* Missing or malformed URL. */ }
  if (!validUrl) issues.push({code:'service_url',message:'On the medpro API service, set RAG_SERVICE_URL to the indexing service private HTTP address, including port 8010.'});
  if (String(env.RAG_SERVICE_KEY || '').length < 32) issues.push({code:'service_key',message:'Set the same RAG_SERVICE_KEY of at least 32 characters on medpro and medpro-rag. Keep its value private.'});
  return {enabled,configured:validUrl && String(env.RAG_SERVICE_KEY || '').length >= 32,ready:issues.length === 0,issues};
}
