export const kes = (n) =>
  'Ksh ' + Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 });

export const kesShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `Ksh ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Ksh ${Math.round(v / 1_000)}K`;
  return `Ksh ${v}`;
};

export const timeAgo = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
