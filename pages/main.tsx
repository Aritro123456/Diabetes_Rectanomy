import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import Landing from '../app/page';
import Dashboard from '../app/dashboard/page';
const isDashboard = document.documentElement.dataset.page === 'dashboard';
createRoot(document.getElementById('root')!).render(isDashboard ? <Dashboard/> : <Landing/>);
