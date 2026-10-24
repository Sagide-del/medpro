import rateLimit,{ipKeyGenerator} from 'express-rate-limit';
import {verifyToken} from '../config/auth.js';
function accountOrIp(req){
 const header=req.headers.authorization || '';
 if(header.startsWith('Bearer '))try{
  const claims=verifyToken(header.slice(7));
  if(typeof claims.sub==='string' && claims.sub.length>0 && claims.sub.length<=128)return `account:${claims.sub}`;
 }catch{/* Unverified/expired tokens share the anonymous IP quota. */}
 return `ip:${ipKeyGenerator(req.ip)}`;
}
function verifiedAccount(req){return accountOrIp(req).startsWith('account:');}
export function createRateLimits({windowMs=15*60*1000,anonymousLimit=300,accountLimit=1800,loginLimit=20,paymentLimit=20}={}){
 const common={windowMs,standardHeaders:true,legacyHeaders:false,handler(req,res){
  const retryAfterSeconds=Math.max(1,Math.ceil(((req.rateLimit?.resetTime?.getTime() || Date.now()+windowMs)-Date.now())/1000));
  res.status(429).json({error:`Too many requests. Try again in ${retryAfterSeconds} seconds.`,code:'RATE_LIMITED',retryAfterSeconds});
 }};
 return {
  apiLimiter:rateLimit({...common,keyGenerator:accountOrIp,limit:req=>verifiedAccount(req)?accountLimit:anonymousLimit}),
  loginLimiter:rateLimit({...common,limit:loginLimit,skipSuccessfulRequests:true}),
  registrationLimiter:rateLimit({...common,limit:loginLimit}),
  paymentLimiter:rateLimit({...common,keyGenerator:accountOrIp,limit:paymentLimit}),
 };
}
