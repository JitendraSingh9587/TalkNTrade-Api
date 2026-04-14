const PAYMENT_STATUSES = new Set(["PAID", "PARTIAL", "UNPAID"]);
const PAYMENT_MODES = new Set(["CASH", "UPI", "CARD", "MIXED"]);

function requirePositiveInt(raw, field, required) {
  if (raw === undefined || raw === null || raw === "") {
    if (required) return { ok: false, error: `${field} is required` };
    return { ok: true, value: undefined };
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

function nonNegativeMoney(raw, field, required) {
  if (raw === undefined || raw === null || raw === "") {
    if (required) return { ok: false, error: `${field} is required` };
    return { ok: true, value: undefined };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${field} must be a non-negative number` };
  }
  return { ok: true, value: round2(n) };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
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
 * @param {{ partial?: boolean }} opts
 */
function validateInvoicePayload(body, { partial = false } = {}) {
  const errors = [];
  const normalized = {};

  if (!partial) {
    if (!body.invoice_number || !String(body.invoice_number).trim()) {
      errors.push("invoice_number is required");
    } else if (String(body.invoice_number).trim().length > 64) {
      errors.push("invoice_number must be at most 64 characters");
    } else normalized.invoice_number = String(body.invoice_number).trim();

    const cid = requirePositiveInt(body.customer_id, "customer_id", true);
    if (!cid.ok) errors.push(cid.error);
    else normalized.customer_id = cid.value;

    if (
      body.product_id !== undefined &&
      body.product_id !== null &&
      body.product_id !== ""
    ) {
      const pid = requirePositiveInt(body.product_id, "product_id", true);
      if (!pid.ok) errors.push(pid.error);
      else normalized.product_id = pid.value;
    }

    const total = nonNegativeMoney(body.total_amount, "total_amount", true);
    if (!total.ok) errors.push(total.error);
    else normalized.total_amount = total.value;

    const disc = nonNegativeMoney(
      body.discount_amount ?? 0,
      "discount_amount",
      false,
    );
    if (!disc.ok) errors.push(disc.error);
    else normalized.discount_amount = disc.value ?? 0;

    const final = nonNegativeMoney(body.final_amount, "final_amount", true);
    if (!final.ok) errors.push(final.error);
    else normalized.final_amount = final.value;

    const paid = nonNegativeMoney(body.paid_amount ?? 0, "paid_amount", false);
    if (!paid.ok) errors.push(paid.error);
    else normalized.paid_amount = paid.value ?? 0;

    const expectedFinal = round2(
      normalized.total_amount - normalized.discount_amount,
    );
    if (Math.abs(expectedFinal - normalized.final_amount) > 0.02) {
      errors.push(
        "final_amount must equal total_amount minus discount_amount (within 0.02)",
      );
    }
    if (normalized.discount_amount > normalized.total_amount + 0.02) {
      errors.push("discount_amount cannot exceed total_amount");
    }

    const pm = normalizeEnum(
      body.payment_mode,
      PAYMENT_MODES,
      "payment_mode",
      "CASH",
    );
    if (!pm.ok) errors.push(pm.error);
    else normalized.payment_mode = pm.value;

    normalized.notes =
      body.notes == null || body.notes === ""
        ? null
        : String(body.notes);
    if (normalized.notes && normalized.notes.length > 65535) {
      errors.push("notes is too long");
    }
  } else {
    if (body.invoice_number !== undefined) {
      if (!body.invoice_number || !String(body.invoice_number).trim()) {
        errors.push("invoice_number cannot be empty");
      } else if (String(body.invoice_number).trim().length > 64) {
        errors.push("invoice_number must be at most 64 characters");
      } else normalized.invoice_number = String(body.invoice_number).trim();
    }
    if (body.customer_id !== undefined) {
      const cid = requirePositiveInt(body.customer_id, "customer_id", true);
      if (!cid.ok) errors.push(cid.error);
      else normalized.customer_id = cid.value;
    }
    if (body.product_id !== undefined) {
      if (body.product_id === null || body.product_id === "") {
        normalized.product_id = null;
      } else {
        const pid = requirePositiveInt(body.product_id, "product_id", true);
        if (!pid.ok) errors.push(pid.error);
        else normalized.product_id = pid.value;
      }
    }
    if (body.total_amount !== undefined) {
      const total = nonNegativeMoney(body.total_amount, "total_amount", true);
      if (!total.ok) errors.push(total.error);
      else normalized.total_amount = total.value;
    }
    if (body.discount_amount !== undefined) {
      const disc = nonNegativeMoney(
        body.discount_amount,
        "discount_amount",
        true,
      );
      if (!disc.ok) errors.push(disc.error);
      else normalized.discount_amount = disc.value;
    }
    if (body.final_amount !== undefined) {
      const final = nonNegativeMoney(body.final_amount, "final_amount", true);
      if (!final.ok) errors.push(final.error);
      else normalized.final_amount = final.value;
    }
    if (body.paid_amount !== undefined) {
      const paid = nonNegativeMoney(body.paid_amount, "paid_amount", true);
      if (!paid.ok) errors.push(paid.error);
      else normalized.paid_amount = paid.value;
    }

    if (body.payment_mode !== undefined) {
      const pm = normalizeEnum(body.payment_mode, PAYMENT_MODES, "payment_mode");
      if (!pm.ok) errors.push(pm.error);
      else normalized.payment_mode = pm.value;
    }

    if (body.notes !== undefined) {
      normalized.notes =
        body.notes == null || body.notes === ""
          ? null
          : String(body.notes);
      if (normalized.notes && normalized.notes.length > 65535) {
        errors.push("notes is too long");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}

module.exports = {
  validateInvoicePayload,
  PAYMENT_STATUSES,
  PAYMENT_MODES,
  round2,
};
