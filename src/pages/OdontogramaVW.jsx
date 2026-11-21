import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import OdontogramApp from 'react-odontogram-editor-modul/src/App';
import 'react-odontogram-editor-modul/src/index.css';
import { loadOdontogramPatientCtrl } from '../controllers/HistoriaClinicaCtrl';
import LoaderVW from '../components/LoaderVW';
import {
  captureOdontogramState,
  loadOdontogramDraft,
  restoreOdontogramState,
  saveOdontogramDraft,
  waitForOdontogramReady,
} from '../utils/odontogramPersistence';

import '../styles/AdminViewsVW.css';
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

    let active = true;
    waitForOdontogramReady().then((ready) => {
      if (!active || !ready) return;
      restoreOdontogramState(loadOdontogramDraft(patientId) || savedOdontogram);
    });

    return () => {
      active = false;
      captureOdontogramState()
        .then((state) => saveOdontogramDraft(patientId, state))
        .catch((error) => console.error('Error guardando borrador del odontograma:', error));
    };
  }, [patientId, loading, savedOdontogram]);

  const odontogramTitle = patient
    ? `Módulo de Odontograma - ${patient.nombre} ${patient.apellidos}`
    : 'Módulo de Odontograma';

  if (!patientId) {
    return (
      <div className="odon-page">
        <h1 className="odon-title">Odontograma</h1>
        <p className="odon-empty">
          El odontograma se guarda dentro de la ficha de cada paciente. Abre un paciente y entra en
          la pestaña "Tratamientos y odontograma".
        </p>
        <Link className="admin-btn primary" to="/pacientes">Ir a pacientes</Link>
      </div>
    );
  }

  return (
    <div className="odon-page">

      {loading ? (
        <LoaderVW text="Cargando información del paciente..." />
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
