// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './themes.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);

// Unregister any existing service workers so they stop intercepting your API calls
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  });
}
