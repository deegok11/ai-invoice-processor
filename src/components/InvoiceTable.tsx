import { useCallback, useMemo } from 'react';
import type { InvoiceData, LineItem } from '../types';
import { formatCurrency } from '../utils/approval';

function calcTotal(lineItems: LineItem[], tax: number): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + tax;
}

interface InvoiceTableProps {
  data: InvoiceData;
  onUpdate: (data: InvoiceData) => void;
  editable: boolean;
}

export function InvoiceTable({ data, onUpdate, editable }: InvoiceTableProps) {
  const computedTotal = useMemo(
    () => calcTotal(data.lineItems, data.tax),
    [data.lineItems, data.tax]
  );

  const handleFieldChange = useCallback(
    (field: keyof InvoiceData, value: string | number) => {
      const updated = { ...data, [field]: value };
      updated.total = calcTotal(updated.lineItems, Number(updated.tax));
      onUpdate(updated);
    },
    [onUpdate, data]
  );

  const handleLineItemChange = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      const newItems = data.lineItems.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        updated.amount = updated.quantity * updated.unitPrice;
        return updated;
      });
      const total = calcTotal(newItems, data.tax);
      onUpdate({ ...data, lineItems: newItems, total });
    },
    [onUpdate, data]
  );

  const addLineItem = useCallback(() => {
    const newItems = [...data.lineItems, { description: '', quantity: 1, unitPrice: 0, amount: 0 }];
    onUpdate({ ...data, lineItems: newItems, total: calcTotal(newItems, data.tax) });
  }, [onUpdate, data]);

  const removeLineItem = useCallback(
    (index: number) => {
      const newItems = data.lineItems.filter((_, i) => i !== index);
      onUpdate({ ...data, lineItems: newItems, total: calcTotal(newItems, data.tax) });
    },
    [onUpdate, data]
  );

  return (
    <div className="invoice-table">
      <h3>Extracted Invoice Data</h3>

      <div className="invoice-fields">
        <div className="field-row">
          <label>Vendor Name</label>
          {editable ? (
            <input
              value={data.vendorName}
              onChange={(e) => handleFieldChange('vendorName', e.target.value)}
            />
          ) : (
            <span>{data.vendorName}</span>
          )}
        </div>
        <div className="field-row">
          <label>Invoice No.</label>
          {editable ? (
            <input
              value={data.invoiceNo}
              onChange={(e) => handleFieldChange('invoiceNo', e.target.value)}
            />
          ) : (
            <span>{data.invoiceNo}</span>
          )}
        </div>
        <div className="field-row">
          <label>Date</label>
          {editable ? (
            <input
              type="date"
              value={data.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
            />
          ) : (
            <span>{data.date}</span>
          )}
        </div>
      </div>

      <h4>Line Items</h4>
      <div className="line-items-wrapper">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Amount</th>
            {editable && <th></th>}
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item, i) => (
            <tr key={i}>
              <td data-label="Description">
                {editable ? (
                  <input
                    value={item.description}
                    onChange={(e) => handleLineItemChange(i, 'description', e.target.value)}
                  />
                ) : (
                  item.description
                )}
              </td>
              <td data-label="Qty">
                {editable ? (
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(i, 'quantity', Number(e.target.value))}
                    min={0}
                  />
                ) : (
                  item.quantity
                )}
              </td>
              <td data-label="Unit Price">
                {editable ? (
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleLineItemChange(i, 'unitPrice', Number(e.target.value))}
                    min={0}
                  />
                ) : (
                  formatCurrency(item.unitPrice)
                )}
              </td>
              <td data-label="Amount">
                {formatCurrency(item.quantity * item.unitPrice)}
              </td>
              {editable && (
                <td data-label="">
                  <button className="btn btn-danger btn-sm" onClick={() => removeLineItem(i)}>
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {editable && (
        <button className="btn btn-secondary btn-sm" onClick={addLineItem}>
          + Add Item
        </button>
      )}

      <div className="invoice-totals">
        <div className="field-row">
          <label>Tax</label>
          {editable ? (
            <input
              type="number"
              value={data.tax}
              onChange={(e) => handleFieldChange('tax', Number(e.target.value))}
              min={0}
            />
          ) : (
            <span>{formatCurrency(data.tax)}</span>
          )}
        </div>
        <div className="field-row total-row">
          <label>Total</label>
          <span className="total-amount">{formatCurrency(computedTotal)}</span>
        </div>
      </div>
    </div>
  );
}
