import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { notificationService } from './services/notificationService';

void notificationService.initialize().catch((err) => {
  // Push is optional until the OneSignal App ID is configured.
  console.info('[NotificationService] OneSignal is not initialized:', err instanceof Error ? err.message : err);
});

createRoot(document.getElementById('root')!).render(<App />);
