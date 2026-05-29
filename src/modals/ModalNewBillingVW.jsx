import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import '../styles/ModalPatientsVW.css';
import { createBillingInvoiceDAO } from '../dao/BillingDAO';
import { listPatientsDAO } from '../dao/PatientsDAO';

const ModalNewInvoiceVW = ({ onClose = () => { }, onSaved = () => { } }) => {
    const [patients, setPatients] = useState([]);
    const [form, setForm] = useState({
        patientDocument: '',
        patientName: '',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        status: 'Pendiente',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const result = await listPatientsDAO();
                // listPatientsDAO historically returns { data, error }
                const data = Array.isArray(result) ? result : result?.data;
                if (result?.error) throw result.error;
                if (mounted) setPatients(data ?? []);
            } catch (err) {
                console.error('Error cargando pacientes:', err);
                if (mounted) setPatients([]);
            }
        };
        load();
        return () => { mounted = false };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'patientDocument') {
            const matched = patients.find((p) => String(p.numero_documento) === String(value));
            const fullname = matched ? `${matched.nombre ?? ''} ${matched.apellidos ?? ''}`.trim() : '';
            setForm((p) => ({ ...p, patientDocument: value, patientName: fullname }));
            return;
        }
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const patient = patients.find((p) => String(p.numero_documento) === String(form.patientDocument));
            const payload = {
                patient_id: patient ? patient.id : null,
                patient_document: patient ? String(patient.numero_documento ?? '') : form.patientDocument || null,
                patient_name: patient ? `${patient.nombre ?? ''} ${patient.apellidos ?? ''}`.trim() : form.patientName || null,
                date: form.date,
                amount: Number(form.amount) || 0,
                status: form.status,
                metadata: { notes: form.notes },
            };

            const created = await createBillingInvoiceDAO(payload);
            onSaved(created);
            onClose();
        } catch (err) {
            console.error('Error creando factura:', err);
            alert('Error guardando factura: ' + (err.message ?? String(err)));
        } finally {
            setSaving(false);
        }
    };

    const modal = (
        <div className="pt-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
                            <label className="pt-label">Documento del paciente</label>
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
                                    <option key={p.id} value={String(p.numero_documento ?? '')}>{`${p.nombre ?? ''} ${p.apellidos ?? ''}`.trim()} - ${String(p.numero_documento ?? '')}</option>
                                ))}
                            </datalist>
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">Nombre paciente</label>
                            <input name="patientName" value={form.patientName} onChange={handleChange} className="pt-input" />
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">Fecha</label>
                            <input type="date" name="date" value={form.date} onChange={handleChange} required className="pt-input" />
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">Monto</label>
                            <input type="number" step="0.01" name="amount" value={form.amount} onChange={handleChange} required className="pt-input" />
                        </div>

                        <div className="pt-field">
                            <label className="pt-label">Estado</label>
                            <div className="pt-select-wrap">
                                <select name="status" value={form.status} onChange={handleChange} className="pt-select">
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Pagado">Pagado</option>
                                    <option value="Anulado">Anulado</option>
                                </select>
                                <div className="pt-select-arrow" />
                            </div>
                        </div>

                        <div className="pt-field pt-field-full">
                            <label className="pt-label">Notas</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} className="pt-input" style={{ height: 100 }} />
                        </div>
                    </div>

                    <div className="pt-modal-nav">
                        <button type="button" className="pt-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
                        <div />
                        <button type="submit" className="pt-btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default ModalNewInvoiceVW;
