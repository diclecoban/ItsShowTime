import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { ErrorBoundary } from './ErrorBoundary';

import './reset.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
);
