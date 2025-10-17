import './index.css';  // ← MUITO IMPORTANTE!
import React from 'react';
import ReactDOM from 'react-dom/client';
import Quiz from './quiz.js'; // Importa o seu componente do quiz

// Encontra o "palco" no ficheiro index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Dá a ordem para "desenhar" o seu quiz no palco
root.render(
  <React.StrictMode>
    <Quiz />
  </React.StrictMode>
);