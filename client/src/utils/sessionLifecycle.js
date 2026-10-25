const protectedPath=/^\/(?:student|teacher|admin|superadmin)(?:\/|$)/;
export function tokenExpired(token,now=Date.now()){
 try{const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return typeof payload.exp==='number'&&payload.exp*1000<=now;}catch{return false;}
}
export function sessionDestination(value,role){
 const prefix={student:'/student/',teacher:'/teacher/',institution_admin:'/admin/',super_admin:'/superadmin/'}[role];
 if(typeof value!=='string'||!prefix||!value.startsWith(prefix)||value.includes('\\'))return null;
 try{const url=new URL(value,'https://medpro.invalid');return url.origin==='https://medpro.invalid'&&url.pathname.startsWith(prefix)?url.pathname+url.search+url.hash:null;}catch{return null;}
}
export function expireSession(token){
 // A late response from an old session must never log out a newer sign-in.
 if(!token||sessionStorage.getItem('medpro_token')!==token)return false;
 const path=window.location.pathname+window.location.search+window.location.hash;
 if(protectedPath.test(window.location.pathname))sessionStorage.setItem('medpro_return_to',path);
 sessionStorage.setItem('medpro_session_expired','true');
 sessionStorage.removeItem('medpro_token');sessionStorage.removeItem('medpro_user');sessionStorage.removeItem('medpro_program');
 window.dispatchEvent(new Event('medpro:session-expired'));return true;
}
