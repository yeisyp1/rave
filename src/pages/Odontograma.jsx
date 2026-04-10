import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OdontogramApp from 'react-odontogram-editor-modul/src/App';
import 'react-odontogram-editor-modul/src/index.css';
import { supabase } from '../Back/lib/supabase';

import '../styles/odontograma.css';

const Odontograma = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(!!patientId);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) {
      console.error('Error cargando paciente:', error);
    } else {
      setPatient(data);
    }
    setLoading(false);
  };

  return (
    <div className="odon-page">
      <h1 className="odon-title">
        Odontograma
        {patient && ` - ${patient.nombre} ${patient.apellidos}`}
      </h1>
      {loading ? (
        <div className="odon-loading">Cargando información del paciente...</div>
      ) : (
        <OdontogramApp
          language="es"
          numberingSystem="FDI"
          darkMode={false}
          onNumberingChange={(n) => console.log('numeración', n)}
          themeConfig={{
            colors: {
              accent: '#0066cc',
              background: '#ffffff',
              text: '#333333',
            },
          }}
        />
      )}
    </div>
  );
};

export default Odontograma;
