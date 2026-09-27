import { getSystemSettingsDAO, updateSystemSettingsDAO } from "../dao/SettingsDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const loadSystemSettingsCtrl = async () => {
  const data = await getSystemSettingsDAO();
  return {
    settings: data,
    form: {
      appointment_duration_minutes: data.appointment_duration_minutes,
      business_hours_start: data.business_hours_start?.slice(0, 5) ?? "",
      business_hours_end: data.business_hours_end?.slice(0, 5) ?? "",
    },
  };
};

export const saveSystemSettingsCtrl = (id, form) =>
  runCtrlAction(() =>
    updateSystemSettingsDAO(id, {
      appointment_duration_minutes: Number(form.appointment_duration_minutes),
      business_hours_start: form.business_hours_start,
      business_hours_end: form.business_hours_end,
    })
  );
