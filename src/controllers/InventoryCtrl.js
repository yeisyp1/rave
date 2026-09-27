import {
  createInventoryItemDAO,
  deleteInventoryItemDAO,
  listInventoryItemsDAO,
  updateInventoryItemDAO,
  updateInventoryItemStockDAO,
} from "../dao/InventoryDAO";
import { runCtrlAction } from "../utils/ctrlResult";

export const INVENTORY_EMPTY_FORM = { name: "", category: "", stock: "", min: "", unit: "" };

export const loadInventoryItemsCtrl = () => listInventoryItemsDAO();

export const createInventoryItemCtrl = (form) =>
  runCtrlAction(() =>
    createInventoryItemDAO({
      name: form.name.trim(),
      category: form.category.trim() || null,
      stock: Number(form.stock),
      min_stock: Number(form.min),
      unit: form.unit.trim(),
    })
  );

export const updateInventoryItemCtrl = (id, form) =>
  runCtrlAction(() =>
    updateInventoryItemDAO(id, {
      name: form.name.trim(),
      category: form.category.trim() || null,
      stock: Number(form.stock),
      min_stock: Number(form.min_stock),
      unit: form.unit.trim(),
    })
  );

export const adjustInventoryStockCtrl = (item, amount) =>
  runCtrlAction(() => {
    const nextStock = Math.max(0, Number(item.stock) + amount);
    return updateInventoryItemStockDAO(item.id, nextStock);
  });

export const deleteInventoryItemCtrl = (id) => runCtrlAction(() => deleteInventoryItemDAO(id));

export const isInventoryItemLow = (item) => Number(item.stock) <= Number(item.min_stock);

export const computeInventoryStatsCtrl = (items) => ({
  lowStockCount: items.filter(isInventoryItemLow).length,
  totalStock: items.reduce((sum, item) => sum + Number(item.stock), 0),
});

const uniqueTrimmedValues = (items, field) =>
  [...new Set(items.map((item) => String(item[field] ?? "").trim()).filter(Boolean))];

export const computeInventoryOptionsCtrl = (items) => ({
  nameOptions: uniqueTrimmedValues(items, "name"),
  categoryOptions: uniqueTrimmedValues(items, "category"),
  unitOptions: uniqueTrimmedValues(items, "unit"),
});
