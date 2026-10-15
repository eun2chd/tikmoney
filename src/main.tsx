import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startAnalytics } from './lib/analytics';
import './styles.css';

// 관리자 페이지는 따로 불러와서 일반 방문자 번들에 섞이지 않게 한다
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));
const isAdmin = location.pathname.replace(/\/+$/, '') === '/admin';

if (!isAdmin) startAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
