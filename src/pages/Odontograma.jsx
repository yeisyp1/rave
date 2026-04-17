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
  const [numberingSystem, setNumberingSystem] = useState('FDI');
  const patientName = patient
    ? String(patient.numero_documento ?? '').trim()
    : '';

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

  const odontogramTitle = patient
    ? `Módulo de Odontograma - ${patient.nombre} ${patient.apellidos}`
    : 'Módulo de Odontograma';

  return (
    <div className="odon-page">

      {loading ? (
        <div className="odon-loading">Cargando información del paciente...</div>
      ) : (
        <OdontogramApp
          title={odontogramTitle}
          patientName={patientName}
          numberingSystem={numberingSystem}
          onNumberingChange={setNumberingSystem}
          
        />
      )}
    </div>
  );
};

export default Odontograma;
