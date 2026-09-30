import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { FiX } from 'react-icons/fi';
import '../styles/ModalPatientsVW.css';
import { createBillingInvoiceCtrl, loadBillableProceduresCtrl } from '../controllers/BillingCtrl';
import { loadPatientsCtrl } from '../controllers/PatientsCtrl';
import { showAlertModal } from '../app/store';

const ModalNewInvoiceVW = ({ onClose = () => {}, onSaved = () => {} }) => {
    const dispatch = useDispatch();
    const [patients, setPatients] = useState([]);

    const getLocalDate = () => {
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    };

    const [form, setForm] = useState({
        patientDocument: '',
        patientName: '',
        date: getLocalDate(),
        notes: '',
    });

    const [saving, setSaving] = useState(false);
    const [billableProcedures, setBillableProcedures] = useState([]);
    const [selectedProcedureIds, setSelectedProcedureIds] = useState([]);
    const [extraItems, setExtraItems] = useState([{ description: '', amount: '' }]);

    const matchedPatient = patients.find(
        (p) => String(p.numero_documento) === String(form.patientDocument)
    );

    useEffect(() => {
        let mounted = true;

        loadBillableProceduresCtrl(matchedPatient?.id)
            .then((procedures) => {
                if (mounted) setBillableProcedures(procedures);
            })
            .catch((err) => {
                console.error('Error cargando tratamientos por facturar:', err);
                if (mounted) setBillableProcedures([]);
            });

        return () => {
            mounted = false;
        };
    }, [matchedPatient?.id]);

    const selectedProcedures = billableProcedures.filter((procedure) => selectedProcedureIds.includes(procedure.id));
    const invoiceTotal =
        selectedProcedures.reduce((sum, procedure) => sum + procedure.total, 0) +
        extraItems.reduce((sum, item) => sum + (Number(item.amount) > 0 ? Number(item.amount) : 0), 0);

    const toggleProcedure = (procedureId) => {
        setSelectedProcedureIds((current) =>
            current.includes(procedureId) ? current.filter((id) => id !== procedureId) : [...current, procedureId]
        );
    };

    const updateExtraItem = (index, field, value) => {
        setExtraItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const data = await loadPatientsCtrl();
                if (mounted) setPatients(data ?? []);
            } catch (err) {
                console.error('Error cargando pacientes:', err);
                if (mounted) setPatients([]);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'patientDocument') {
            const matched = patients.find(
                (p) => String(p.numero_documento) === String(value)
            );

            const fullname = matched
                ? `${matched.nombre ?? ''} ${matched.apellidos ?? ''}`.trim()
                : '';

            setForm((p) => ({
                ...p,
                patientDocument: value,
                patientName: fullname,
            }));
            setSelectedProcedureIds([]);

            return;
        }

        setForm((p) => ({
            ...p,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const result = await createBillingInvoiceCtrl({ form, patients, procedures: selectedProcedures, extraItems });

        if (!result.ok) {
            dispatch(showAlertModal({ message: 'Error guardando factura: ' + result.message, variant: 'error' }));
        } else {
            onSaved(result.data);
            onClose();
        }

        setSaving(false);
    };

    const modal = (
        <div
            className="pt-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="pt-modal">
                <div className="pt-modal-header">
                    <div>
                        <h2 className="pt-modal-title">Nueva factura</h2>
                    </div>

                    <button className="pt-modal-close" onClick={onClose}>
                        <FiX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="pt-modal-body">
                    <div className="pt-form-grid">
                        <div className="pt-field pt-field-full">
                            <label className="pt-label">
                                Documento del paciente
                            </label>

                            <input
                                list="billing-patient-list"
                                name="patientDocument"
                                value={form.patientDocument}
                                onChange={handleChange}
                                placeholder="Selecciona o escribe el número de documento"
                                className="pt-input"
                            />

                            <datalist id="billing-patient-list">
                                {patients.map((p) => (
                                    <option
                                        key={p.id}
                                        value={String(p.numero_documento ?? '')}
                                    >
                                        {`${p.nombre ?? ''} ${p.apellidos ?? ''}`.trim()} - {String(
                                            p.numero_documento ?? ''
                                        )}
                                    </option>
                                ))}
                            </datalist>
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">
                                Nombre paciente
                            </label>

                            <input
                                name="patientName"
                                value={form.patientName}
                                onChange={handleChange}
                                className="pt-input"
                            />
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">Fecha</label>

                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                required
                                className="pt-input"
                            />
                        </div>

                        <div className="pt-field pt-field-full">
                            <label className="pt-label">Tratamientos realizados por facturar</label>
                            {!matchedPatient ? (
                                <span>Selecciona un paciente registrado para ver sus tratamientos realizados.</span>
                            ) : billableProcedures.length === 0 ? (
                                <span>El paciente no tiene tratamientos realizados pendientes de facturar.</span>
                            ) : (
                                billableProcedures.map((procedure) => (
                                    <label key={procedure.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedProcedureIds.includes(procedure.id)}
                                            onChange={() => toggleProcedure(procedure.id)}
                                        />
                                        <span style={{ flex: 1 }}>{procedure.date} · {procedure.description}</span>
                                        <strong>${procedure.total.toLocaleString('es-CO')}</strong>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="pt-field pt-field-full">
                            <label className="pt-label">Otros conceptos</label>
                            {extraItems.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        value={item.description}
                                        onChange={(e) => updateExtraItem(index, 'description', e.target.value)}
                                        placeholder="Concepto (ej. consulta de valoración)"
                                        className="pt-input"
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.amount}
                                        onChange={(e) => updateExtraItem(index, 'amount', e.target.value)}
                                        placeholder="Valor"
                                        className="pt-input"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                className="pt-btn-ghost"
                                onClick={() => setExtraItems((current) => [...current, { description: '', amount: '' }])}
                            >
                                + Agregar concepto
                            </button>
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">Total</label>
                            <strong>${invoiceTotal.toLocaleString('es-CO')}</strong>
                        </div>

                        <div className="pt-field pt-field-full">
                            <label className="pt-label">Notas</label>

                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                className="pt-input"
                                style={{ height: 100 }}
                            />
                        </div>
                    </div>

                    <div className="pt-modal-nav">
                        <button
                            type="button"
                            className="pt-btn-ghost"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancelar
                        </button>

                        <div />

                        <button
                            type="submit"
                            className="pt-btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default ModalNewInvoiceVW;