import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  calcPatientAgeCtrl,
  canNextPatientStepCtrl,
  PATIENT_EMPTY_FORM,
  savePatientCtrl,
} from "../controllers/PatientsCtrl";
import { showAlertModal } from "../app/store";

/**
 * Custom hook para manejar la lógica del modal de edición de pacientes
 * @param {Function} onSaveCallback - Callback ejecutado después de guardar (ej: para recargar datos)
 * @returns {Object} Estado y handlers del modal
 */
export const usePatientModal = (onSaveCallback = null) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(PATIENT_EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "fecha_nacimiento") updated.edad = calcPatientAgeCtrl(value);
    setForm(updated);
  };

  const canNext = () => canNextPatientStepCtrl(step, form);

  const resetForm = () => {
    setForm(PATIENT_EMPTY_FORM);
    setStep(0);
  };

  const openEditModal = (patient = null) => {
    if (patient) {
      setForm(patient);
      setEditingId(patient.id);
    } else {
      resetForm();
      setEditingId(null);
    }
    setStep(0);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await savePatientCtrl({ form, editingId });
    if (!result.ok) {
      if (result.error) console.error(result.error);
      dispatch(showAlertModal({ message: result.message, variant: "error" }));
      return;
    }

    dispatch(showAlertModal({ message: result.message, variant: "success" }));
    closeModal();

    if (onSaveCallback) {
      onSaveCallback();
    }
  };

  return {
    // Estado
    showModal,
    step,
    form,
    editingId,

    // Setters
    setShowModal,
    setStep,
    setForm,

    // Handlers
    handleChange,
    handleSubmit,
    openEditModal,
    closeModal,
    canNext,
    resetForm,
  };
};
