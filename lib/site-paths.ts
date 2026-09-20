declare const __PAGES_BASE__: string;
const base = typeof __PAGES_BASE__ === 'string' ? __PAGES_BASE__ : '';
export const homeUrl = `${base}/`;
export const dashboardUrl = `${base}/dashboard/`;
