import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OdontogramApp from 'react-odontogram-editor-modul/src/App';
import 'react-odontogram-editor-modul/src/index.css';
import { loadOdontogramPatientCtrl } from '../controllers/HistoriaClinicaCtrl';
import LoaderVW from '../components/LoaderVW';
import {
  captureOdontogramState,
  loadOdontogramDraft,
  restoreOdontogramState,
  saveOdontogramDraft,
} from '../utils/odontogramPersistence';

import '../styles/OdontogramaVW.css';

const Odontograma = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(!!patientId);
  const [numberingSystem, setNumberingSystem] = useState('FDI');
  const [savedOdontogram, setSavedOdontogram] = useState(null);
  const patientName = patient
    ? String(patient.numero_documento ?? '').trim()
    : '';

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const { patient: data, savedOdontogram: odontogram } = await loadOdontogramPatientCtrl(patientId);
      setPatient(data);
      setSavedOdontogram(odontogram);
    } catch (error) {
      console.error('Error cargando paciente:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    if (!patientId || loading) return undefined;

    const restore = window.setTimeout(() => {
      const draft = loadOdontogramDraft(patientId);
      restoreOdontogramState(draft || savedOdontogram);
    }, 0);

    return () => {
      window.clearTimeout(restore);
      captureOdontogramState()
        .then((state) => saveOdontogramDraft(patientId, state))
        .catch((error) => console.error('Error guardando borrador del odontograma:', error));
    };
  }, [patientId, loading, savedOdontogram]);

  const odontogramTitle = patient
    ? `Módulo de Odontograma - ${patient.nombre} ${patient.apellidos}`
    : 'Módulo de Odontograma';

  return (
    <div className="odon-page">

      {loading ? (
        <LoaderVW text="Cargando informacion del paciente..." />
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
