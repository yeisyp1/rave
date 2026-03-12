import React from 'react';
// Import the odontogram component from the GitHub package we installed
// the library ships the raw TypeScript source; Vite will compile it on the fly.
import OdontogramApp from 'react-odontogram-editor-modul/src/App';
// bring the bundled styles so the odonto UI looks correct
import 'react-odontogram-editor-modul/src/index.css';

// our own page styling (margins, etc.)
import '../styles/odontograma.css';

// you can customize the props below as required by the README
const Odontograma = () => {
  return (
    <div className="odon-page">
      <h1 className="odon-title">Odontograma</h1>
      <OdontogramApp
        language="es"
        numberingSystem="FDI"
        darkMode={false}
        onLanguageChange={(l) => console.log('idioma', l)}
        onNumberingChange={(n) => console.log('numeración', n)}
        themeConfig={{
          colors: {
            accent: '#0066cc',
            background: '#ffffff',
            text: '#333333',
          },
        }}
      />
    </div>
  );
};

export default Odontograma;
