const { validateCustomerPayload } = require("./customerValidator");
const { round2, PAYMENT_MODES } = require("./invoiceValidator");

function nonNegativeMoney(raw, field, defaultValue) {
  if (raw === undefined || raw === null || raw === "") {
    if (defaultValue !== undefined) return { ok: true, value: defaultValue };
    return { ok: false, error: `${field} is required` };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${field} must be a non-negative number` };
  }
  return { ok: true, value: round2(n) };
}

function normalizeEnum(raw, allowed, field, defaultValue) {
  if (raw === undefined || raw === null || raw === "") {
    if (defaultValue !== undefined) return { ok: true, value: defaultValue };
    return { ok: false, error: `${field} is required` };
  }
  const u = String(raw).trim().toUpperCase();
  if (!allowed.has(u)) {
    return {
      ok: false,
      error: `${field} must be one of: ${[...allowed].join(", ")}`,
    };
  }
  return { ok: true, value: u };
}

const MAX_LINES = 30;

/**
 * @param {object} body
 */
function validateMultiProductSalePayload(body) {
  const errors = [];
  const normalized = {};

  if (!body.lines || !Array.isArray(body.lines)) {
    errors.push("lines must be an array");
  } else if (body.lines.length === 0) {
    errors.push("At least one line item is required");
  } else if (body.lines.length > MAX_LINES) {
    errors.push(`At most ${MAX_LINES} line items allowed`);
  } else {
    const seen = new Set();
    const lines = [];
    const lineErrors = [];
    for (let i = 0; i < body.lines.length; i++) {
      const L = body.lines[i];
      if (!L || typeof L !== "object") {
        lineErrors.push(`lines[${i}] must be an object`);
        continue;
      }
      const pid = parseInt(L.product_id, 10);
      if (Number.isNaN(pid) || pid < 1) {
        lineErrors.push(`lines[${i}].product_id must be a positive integer`);
        continue;
      }
      if (seen.has(pid)) {
        lineErrors.push(`Duplicate product_id in lines: ${pid}`);
        continue;
      }
      seen.add(pid);

      let qty = parseInt(L.quantity, 10);
      if (Number.isNaN(qty) || qty < 1) qty = 1;
      if (qty > 99) qty = 99;

      const totalAmt = Number(L.total_amount);
      if (!Number.isFinite(totalAmt) || totalAmt <= 0) {
        lineErrors.push(`lines[${i}].total_amount must be a positive number`);
        continue;
      }

      lines.push({
        product_id: pid,
        quantity: qty,
        total_amount: round2(totalAmt),
      });
    }
    errors.push(...lineErrors);
    if (lineErrors.length === 0 && lines.length > 0) {
      normalized.lines = lines;
    }
  }

  if (!body.customer || typeof body.customer !== "object") {
    errors.push("customer is required and must be an object");
  } else {
    const c = validateCustomerPayload(body.customer, { partial: false });
    if (!c.isValid) errors.push(...c.errors);
    else normalized.customer = c.normalized;
  }

  const disc = nonNegativeMoney(
    body.discount_amount ?? 0,
    "discount_amount",
    0,
  );
  if (!disc.ok) errors.push(disc.error);
  else normalized.discount_amount = disc.value;

  if (
    body.final_amount !== undefined &&
    body.final_amount !== null &&
    body.final_amount !== ""
  ) {
    const finalOpt = nonNegativeMoney(body.final_amount, "final_amount");
    if (!finalOpt.ok) errors.push(finalOpt.error);
    else normalized.final_amount = finalOpt.value;
  }

  const paid = nonNegativeMoney(body.paid_amount ?? 0, "paid_amount", 0);
  if (!paid.ok) errors.push(paid.error);
  else normalized.paid_amount = paid.value;

  const pm = normalizeEnum(
    body.payment_mode,
    PAYMENT_MODES,
    "payment_mode",
    "CASH",
  );
  if (!pm.ok) errors.push(pm.error);
  else normalized.payment_mode = pm.value;

  if (body.invoice_number !== undefined && body.invoice_number !== null) {
    const s = String(body.invoice_number).trim();
    if (s.length > 64) errors.push("invoice_number must be at most 64 characters");
    else if (s) normalized.invoice_number = s;
  }

  normalized.invoice_notes =
    body.invoice_notes == null || body.invoice_notes === ""
      ? null
      : String(body.invoice_notes);
  if (normalized.invoice_notes && normalized.invoice_notes.length > 65535) {
    errors.push("invoice_notes is too long");
  }

  if (normalized.lines && normalized.discount_amount !== undefined) {
    const subtotal = round2(
      normalized.lines.reduce((s, l) => s + l.total_amount, 0),
    );
    normalized.computed_subtotal = subtotal;
    const expectedFinal = round2(subtotal - normalized.discount_amount);
    if (normalized.final_amount !== undefined) {
      if (Math.abs(expectedFinal - normalized.final_amount) > 0.02) {
        errors.push(
          "final_amount must equal sum of line totals minus discount_amount (within 0.02)",
        );
      }
    } else {
      normalized.final_amount = expectedFinal;
    }
    if (normalized.paid_amount > normalized.final_amount + 0.02) {
      errors.push("paid_amount cannot exceed final_amount");
    }
  }

  if (
    body.organisation_id !== undefined &&
    body.organisation_id !== null &&
    body.organisation_id !== ""
  ) {
    const oid = parseInt(body.organisation_id, 10);
    if (Number.isNaN(oid) || oid < 1) {
      errors.push("organisation_id must be a positive integer");
    } else normalized.organisation_id = oid;
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}

module.exports = { validateMultiProductSalePayload, MAX_LINES };
