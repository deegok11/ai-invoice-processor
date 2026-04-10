import { useState, useCallback } from 'react';
import type { Vendor } from '../types';

interface VendorManagerProps {
  vendors: Vendor[];
  onAdd: (vendor: Vendor) => void;
  onUpdate: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

const EMPTY_FORM = { name: '', aliases: '', gst: '' };

export function VendorManager({ vendors, onAdd, onUpdate, onDelete }: VendorManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [showAddRow, setShowAddRow] = useState(false);

  const startEdit = useCallback((vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditForm({ name: vendor.name, aliases: vendor.aliases.join(', '), gst: vendor.gst });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId || !editForm.name.trim()) return;
    onUpdate({
      id: editingId,
      name: editForm.name.trim(),
      aliases: editForm.aliases.split(',').map((a) => a.trim()).filter(Boolean),
      gst: editForm.gst.trim(),
    });
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }, [editingId, editForm, onUpdate]);

  const commitAdd = useCallback(() => {
    if (!addForm.name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: addForm.name.trim(),
      aliases: addForm.aliases.split(',').map((a) => a.trim()).filter(Boolean),
      gst: addForm.gst.trim(),
    });
    setAddForm(EMPTY_FORM);
    setShowAddRow(false);
  }, [addForm, onAdd]);

  const cancelAdd = useCallback(() => {
    setAddForm(EMPTY_FORM);
    setShowAddRow(false);
  }, []);

  return (
    <div className="vendor-manager">
      <div className="vendor-manager-header">
        <div>
          <h3 className="vendor-manager-title">🏢 Vendor Master List</h3>
          <p className="vendor-manager-subtitle">{vendors.length} vendors · used for fuzzy matching during invoice extraction</p>
        </div>
        {!showAddRow && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddRow(true)}>
            + Add Vendor
          </button>
        )}
      </div>

      <div className="vendor-table-wrap">
        <table className="vendor-table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Aliases</th>
              <th>GST Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) =>
              editingId === vendor.id ? (
                <tr key={vendor.id} className="vendor-row-editing">
                  <td>
                    <input
                      className="vendor-cell-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Vendor name"
                    />
                  </td>
                  <td>
                    <input
                      className="vendor-cell-input"
                      value={editForm.aliases}
                      onChange={(e) => setEditForm((f) => ({ ...f, aliases: e.target.value }))}
                      placeholder="Alias1, Alias2"
                    />
                  </td>
                  <td>
                    <input
                      className="vendor-cell-input"
                      value={editForm.gst}
                      onChange={(e) => setEditForm((f) => ({ ...f, gst: e.target.value }))}
                      placeholder="GST number"
                    />
                  </td>
                  <td className="vendor-row-actions">
                    <button className="btn btn-primary btn-sm" onClick={commitEdit}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={vendor.id} className="vendor-row">
                  <td className="vendor-cell-name">{vendor.name}</td>
                  <td className="vendor-cell-aliases">
                    {vendor.aliases.length > 0
                      ? vendor.aliases.map((a) => <span key={a} className="alias-tag">{a}</span>)
                      : <span className="vendor-cell-empty">—</span>}
                  </td>
                  <td className="vendor-cell-gst">{vendor.gst || <span className="vendor-cell-empty">—</span>}</td>
                  <td className="vendor-row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(vendor)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(vendor.id)}>Delete</button>
                  </td>
                </tr>
              )
            )}

            {showAddRow && (
              <tr className="vendor-row-editing vendor-row-new">
                <td>
                  <input
                    className="vendor-cell-input"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Vendor name *"
                    autoFocus
                  />
                </td>
                <td>
                  <input
                    className="vendor-cell-input"
                    value={addForm.aliases}
                    onChange={(e) => setAddForm((f) => ({ ...f, aliases: e.target.value }))}
                    placeholder="Alias1, Alias2"
                  />
                </td>
                <td>
                  <input
                    className="vendor-cell-input"
                    value={addForm.gst}
                    onChange={(e) => setAddForm((f) => ({ ...f, gst: e.target.value }))}
                    placeholder="GST number"
                  />
                </td>
                <td className="vendor-row-actions">
                  <button className="btn btn-primary btn-sm" onClick={commitAdd} disabled={!addForm.name.trim()}>Add</button>
                  <button className="btn btn-secondary btn-sm" onClick={cancelAdd}>Cancel</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
