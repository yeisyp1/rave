import {
  createMessageTemplateDAO,
  deleteMessageTemplateDAO,
  listMessageTemplatesDAO,
  updateMessageTemplateDAO,
} from "../dao/MessageTemplatesDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const MESSAGE_TEMPLATE_EMPTY_FORM = { name: "", channel: "Email", subject: "", body: "", active: true };

export const loadMessageTemplatesCtrl = () => listMessageTemplatesDAO();

export const createMessageTemplateCtrl = (form) =>
  runCtrlAction(() =>
    createMessageTemplateDAO({
      name: form.name.trim(),
      channel: form.channel,
      subject: form.subject.trim() || null,
      body: form.body.trim(),
    })
  );

export const updateMessageTemplateCtrl = (id, form) =>
  runCtrlAction(() =>
    updateMessageTemplateDAO(id, {
      name: form.name.trim(),
      channel: form.channel,
      subject: form.subject.trim() || null,
      body: form.body.trim(),
    })
  );

export const toggleMessageTemplateActiveCtrl = (template) =>
  runCtrlAction(() => updateMessageTemplateDAO(template.id, { active: !template.active }));

export const deleteMessageTemplateCtrl = (id) => runCtrlAction(() => deleteMessageTemplateDAO(id));
