const CUSTOMER_TYPES = new Set([
  "RETAIL",
  "WHOLESALE",
  "B2B",
  "CORPORATE",
  "OTHER",
]);

function optionalPositiveInt(raw, field) {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: null };
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    return { ok: false, error: `${field} must be a positive integer or empty` };
  }
  return { ok: true, value: n };
}

function parseBool(raw) {
  if (raw === undefined || raw === null || raw === "")
    return { ok: true, value: undefined };
  if (typeof raw === "boolean") return { ok: true, value: raw };
  if (raw === 1 || raw === "1" || raw === "true")
    return { ok: true, value: true };
  if (raw === 0 || raw === "0" || raw === "false")
    return { ok: true, value: false };
  return { ok: false, error: "must be a boolean" };
}

function normalizeOptionalString(raw, maxLen) {
  if (raw === undefined || raw === null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (maxLen && s.length > maxLen) return { error: `must be at most ${maxLen} characters` };
  return s;
}

function isValidEmail(s) {
  if (!s || s.length > 191) return false;
  // pragmatic check; full RFC validation is not required here
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * @param {unknown} raw
 * @returns {{ ok: boolean, value?: object, error?: string }}
 */
function normalizeAddress(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: {} };
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object" && !Array.isArray(p)) {
        return { ok: true, value: p };
      }
    } catch {
      return { ok: false, error: "address must be a JSON object" };
    }
    return { ok: false, error: "address must be a JSON object" };
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return { ok: true, value: raw };
  }
  return { ok: false, error: "address must be a JSON object" };
}

/**
 * @param {object} body
 * @param {{ partial?: boolean }} opts
 */
function validateCustomerPayload(body, { partial = false } = {}) {
  const errors = [];
  const normalized = {};

  if (!partial) {
    if (!body.full_name || !String(body.full_name).trim()) {
      errors.push("full_name is required");
    } else if (String(body.full_name).length > 255) {
      errors.push("full_name must be at most 255 characters");
    } else normalized.full_name = String(body.full_name).trim();

    if (!body.phone || !String(body.phone).trim()) {
      errors.push("phone is required");
    } else if (String(body.phone).length > 32) {
      errors.push("phone must be at most 32 characters");
    } else normalized.phone = String(body.phone).trim();
  } else {
    if (body.full_name !== undefined) {
      if (!body.full_name || !String(body.full_name).trim()) {
        errors.push("full_name cannot be empty");
      } else if (String(body.full_name).length > 255) {
        errors.push("full_name must be at most 255 characters");
      } else normalized.full_name = String(body.full_name).trim();
    }
    if (body.phone !== undefined) {
      if (!body.phone || !String(body.phone).trim()) {
        errors.push("phone cannot be empty");
      } else if (String(body.phone).length > 32) {
        errors.push("phone must be at most 32 characters");
      } else normalized.phone = String(body.phone).trim();
    }
  }

  const emailRaw =
    body.email !== undefined ? body.email : partial ? undefined : null;
  if (emailRaw !== undefined) {
    const e = normalizeOptionalString(emailRaw, 191);
    if (e && typeof e === "object" && e.error) errors.push(`email ${e.error}`);
    else if (e === null) normalized.email = null;
    else if (!isValidEmail(e)) errors.push("email must be valid");
    else normalized.email = e;
  } else if (!partial) {
    normalized.email = null;
  }

  const alt =
    body.alternate_phone !== undefined
      ? body.alternate_phone
      : partial
        ? undefined
        : null;
  if (alt !== undefined) {
    const s = normalizeOptionalString(alt, 32);
    if (s && typeof s === "object" && s.error)
      errors.push(`alternate_phone ${s.error}`);
    else normalized.alternate_phone = s;
  } else if (!partial) {
    normalized.alternate_phone = null;
  }

  const company =
    body.company_name !== undefined
      ? body.company_name
      : partial
        ? undefined
        : null;
  if (company !== undefined) {
    const s = normalizeOptionalString(company, 255);
    if (s && typeof s === "object" && s.error)
      errors.push(`company_name ${s.error}`);
    else normalized.company_name = s;
  } else if (!partial) {
    normalized.company_name = null;
  }

  const gst =
    body.gst_number !== undefined ? body.gst_number : partial ? undefined : null;
  if (gst !== undefined) {
    const s = normalizeOptionalString(gst, 32);
    if (s && typeof s === "object" && s.error)
      errors.push(`gst_number ${s.error}`);
    else normalized.gst_number = s;
  } else if (!partial) {
    normalized.gst_number = null;
  }

  if (body.address !== undefined || !partial) {
    const rawAddr = body.address !== undefined ? body.address : {};
    const addr = normalizeAddress(rawAddr);
    if (!addr.ok) errors.push(addr.error);
    else normalized.address = addr.value;
  }

  const ctypeRaw =
    body.customer_type !== undefined
      ? body.customer_type
      : partial
        ? undefined
        : "RETAIL";
  if (ctypeRaw !== undefined) {
    const c = String(ctypeRaw).trim().toUpperCase();
    if (!CUSTOMER_TYPES.has(c)) {
      errors.push(
        `customer_type must be one of: ${[...CUSTOMER_TYPES].join(", ")}`,
      );
    } else normalized.customer_type = c;
  } else if (!partial) {
    normalized.customer_type = "RETAIL";
  }

  if (body.assigned_to !== undefined || !partial) {
    const raw = body.assigned_to !== undefined ? body.assigned_to : null;
    const a = optionalPositiveInt(raw, "assigned_to");
    if (!a.ok) errors.push(a.error);
    else normalized.assigned_to = a.value;
  }

  const notesRaw =
    body.notes !== undefined ? body.notes : partial ? undefined : null;
  if (notesRaw !== undefined) {
    if (notesRaw === null || notesRaw === "") normalized.notes = null;
    else {
      const s = String(notesRaw);
      if (s.length > 65535) errors.push("notes is too long");
      else normalized.notes = s;
    }
  } else if (!partial) {
    normalized.notes = null;
  }

  if (!partial) {
    const b = parseBool(body.is_verified ?? false);
    if (!b.ok) errors.push(`is_verified ${b.error}`);
    else normalized.is_verified = b.value;
  } else if (body.is_verified !== undefined) {
    const b = parseBool(body.is_verified);
    if (!b.ok) errors.push(`is_verified ${b.error}`);
    else normalized.is_verified = b.value;
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}

module.exports = {
  validateCustomerPayload,
  CUSTOMER_TYPES,
};
