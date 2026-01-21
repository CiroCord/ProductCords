import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/vendor.css'
import './styles/style.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { ApiProvider } from "./components/ApiContext.jsx";

createRoot(document.getElementById('root')).render(
     <ApiProvider>
      <App />
    </ApiProvider>
)
