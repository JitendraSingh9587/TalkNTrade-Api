const { validateCustomerPayload } = require("./customerValidator");
const { round2, PAYMENT_MODES } = require("./invoiceValidator");

function requirePositiveInt(raw, field) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

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

/**
 * @param {object} body
 */
function validateProductSalePayload(body) {
  const errors = [];
  const normalized = {};

  const pid = requirePositiveInt(body.product_id, "product_id");
  if (!pid.ok) errors.push(pid.error);
  else normalized.product_id = pid.value;

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
    body.total_amount !== undefined &&
    body.total_amount !== null &&
    body.total_amount !== ""
  ) {
    const totalOpt = nonNegativeMoney(body.total_amount, "total_amount");
    if (!totalOpt.ok) errors.push(totalOpt.error);
    else normalized.total_amount = totalOpt.value;
  }

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

  if (
    normalized.total_amount !== undefined &&
    normalized.final_amount !== undefined
  ) {
    const expected = round2(
      normalized.total_amount - normalized.discount_amount,
    );
    if (Math.abs(expected - normalized.final_amount) > 0.02) {
      errors.push(
        "final_amount must equal total_amount minus discount_amount (within 0.02)",
      );
    }
  }

  if (
    normalized.final_amount !== undefined &&
    normalized.paid_amount !== undefined
  ) {
    if (normalized.paid_amount > normalized.final_amount + 0.02) {
      errors.push("paid_amount cannot exceed final_amount");
    }
  }

  if (body.organisation_id !== undefined && body.organisation_id !== null) {
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

module.exports = { validateProductSalePayload };
