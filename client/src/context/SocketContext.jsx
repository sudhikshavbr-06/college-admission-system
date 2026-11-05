import {
createContext,
useContext,
useEffect,
useRef,
useState,
useCallback,
} from 'react';

import { io } from 'socket.io-client';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';
import Toasts from '../components/Toasts.jsx';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

let toastId = 0;

export function SocketProvider({ children }) {
const { user } = useAuth();

const [socket, setSocket] = useState(null);
const [toasts, setToasts] = useState([]);
const [unread, setUnread] = useState(0);

const roleRef = useRef(null);

const pushToast = useCallback((t) => {
const id = ++toastId;

setToasts((prev) => [
  ...prev.slice(-3),
  { id, ...t },
]);

setTimeout(() => {
  setToasts((prev) => prev.filter((x) => x.id !== id));
}, 6000);

}, []);

const dismissToast = useCallback((id) => {
setToasts((prev) => prev.filter((x) => x.id !== id));
}, []);

// Keep the current user role updated.
useEffect(() => {
roleRef.current = user?.role || null;
}, [user]);

// Fetch unread notification count.
useEffect(() => {
if (user) {
api
.get('/notifications/mine')
.then((res) => {
setUnread(
res.data.filter((n) => !n.read).length
);
})
.catch(() => {});
} else {
setUnread(0);
}
}, [user]);

// Establish Socket.IO connection.
useEffect(() => {
if (!user) {
setSocket((currentSocket) => {
currentSocket?.disconnect();
return null;
});

  return;
}

// Uses Render URL in production.
// Uses the Vite proxy during local development.
const socketUrl =
  import.meta.env.VITE_API_URL || '/';

const s = io(socketUrl, {
  auth: {
    token: localStorage.getItem('mit_token'),
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

s.on('connect', () => {
  console.log('Socket.IO connected:', s.id);
});

s.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error.message);
});

// General notification.
s.on('notification', (payload) => {
  pushToast(payload);

  setUnread((u) => u + 1);

  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: { source: 'notification' },
    })
  );
});

// Application updated.
s.on('application:updated', (payload) => {
  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: {
        source: 'application:updated',
        ...payload,
      },
    })
  );
});

// Payment success.
s.on('payment:success', (payload) => {
  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: {
        source: 'payment:success',
        ...payload,
      },
    })
  );
});

// New application received.
s.on('application:submitted', (payload) => {
  if (roleRef.current !== 'admin') return;

  pushToast({
    title: 'New Application Received',
    message: `${payload.applicationNumber} — ${payload.studentName} (${payload.course})`,
    type: 'info',
  });

  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: {
        source: 'application:submitted',
        ...payload,
      },
    })
  );
});

// Document uploaded.
s.on('document:uploaded', (payload) => {
  if (roleRef.current !== 'admin') return;

  pushToast({
    title: 'Document Uploaded',
    message: `${payload.studentName} uploaded ${payload.docType.replaceAll('_', ' ')}`,
    type: 'info',
  });

  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: {
        source: 'document:uploaded',
        ...payload,
      },
    })
  );
});

// Payment received.
s.on('payment:received', (payload) => {
  if (roleRef.current !== 'admin') return;

  pushToast({
    title: 'Payment Received',
    message: `${payload.studentName} paid ₹${payload.amount.toLocaleString('en-IN')} via ${payload.method.toUpperCase()}`,
    type: 'success',
  });

  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: {
        source: 'payment:received',
        ...payload,
      },
    })
  );
});

// Document reviewed.
s.on('document:reviewed', () => {
  window.dispatchEvent(
    new CustomEvent('server:refresh', {
      detail: { source: 'document:reviewed' },
    })
  );
});

setSocket(s);

return () => {
  s.disconnect();
};

}, [user, pushToast]);

return (
<SocketContext.Provider
value={{
socket,
pushToast,
toasts,
dismissToast,
unread,
setUnread,
}}
>
{children}

  <Toasts
    toasts={toasts}
    dismiss={dismissToast}
  />
</SocketContext.Provider>

);
}