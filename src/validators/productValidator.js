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

function optionalDecimal(raw, field) {
  if (raw === undefined || raw === null || raw === "")
    return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${field} must be a non-negative number` };
  }
  return { ok: true, value: n };
}

function parseBool(raw) {
  if (typeof raw === "boolean") return { ok: true, value: raw };
  if (raw === 1 || raw === "1" || raw === "true")
    return { ok: true, value: true };
  if (raw === 0 || raw === "0" || raw === "false")
    return { ok: true, value: false };
  return { ok: false, error: "must be a boolean" };
}

function normalizeImages(raw) {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) {
    if (typeof raw === "string") {
      try {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return normalizeImages(p);
      } catch {
        /* ignore */
      }
    }
    return {
      ok: false,
      error: "product_images must be a JSON array of URL strings",
    };
  }
  const urls = raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  if (urls.some((u) => u.length > 2048)) {
    return {
      ok: false,
      error: "Each image URL must be at most 2048 characters",
    };
  }
  return { ok: true, value: urls };
}

/**
 * @param {object} body
 * @param {{ partial?: boolean }} opts
 */
function validateProductPayload(body, { partial = false } = {}) {
  const errors = [];
  const normalized = {};

  if (!partial) {
    if (!body.name || !String(body.name).trim())
      errors.push("name is required");
    else if (String(body.name).length > 255) {
      errors.push("name must be at most 255 characters");
    } else normalized.name = String(body.name).trim();

    const bid = requirePositiveInt(body.brand_id, "brand_id", true);
    if (!bid.ok) errors.push(bid.error);
    else normalized.brand_id = bid.value;

    const mid = requirePositiveInt(body.model_id, "model_id", true);
    if (!mid.ok) errors.push(mid.error);
    else normalized.model_id = mid.value;

    normalized.description =
      body.description == null || body.description === ""
        ? null
        : String(body.description);
    if (normalized.description && normalized.description.length > 65535) {
      errors.push("description is too long");
    }

    normalized.variant =
      body.variant == null || body.variant === ""
        ? null
        : String(body.variant).slice(0, 128);

    const pp = optionalDecimal(body.purchase_price, "purchase_price");
    if (!pp.ok) errors.push(pp.error);
    else normalized.purchase_price = pp.value;

    const ac = optionalDecimal(body.additional_charges, "additional_charges");
    if (!ac.ok) errors.push(ac.error);
    else normalized.additional_charges = ac.value === null ? 0 : ac.value;

    const msp = optionalDecimal(
      body.minimum_selling_price,
      "minimum_selling_price",
    );
    if (!msp.ok) errors.push(msp.error);
    else normalized.minimum_selling_price = msp.value;

    normalized.imei_number =
      body.imei_number == null || body.imei_number === ""
        ? null
        : String(body.imei_number).replace(/\s/g, "").slice(0, 20);

    normalized.color =
      body.color == null || body.color === ""
        ? null
        : String(body.color).slice(0, 64);
    normalized.network_type =
      body.network_type == null || body.network_type === ""
        ? null
        : String(body.network_type).slice(0, 64);

    if (body.is_new === undefined) normalized.is_new = true;
    else {
      const b = parseBool(body.is_new);
      if (!b.ok) errors.push(`is_new ${b.error}`);
      else normalized.is_new = b.value;
    }

    for (const key of ["charger_available", "box_available", "is_sold"]) {
      if (body[key] === undefined) normalized[key] = false;
      else {
        const b = parseBool(body[key]);
        if (!b.ok) errors.push(`${key} ${b.error}`);
        else normalized[key] = b.value;
      }
    }

    normalized.warranty_available_time =
      body.warranty_available_time == null ||
      body.warranty_available_time === ""
        ? null
        : String(body.warranty_available_time).slice(0, 32);
    normalized.warranty_duration =
      body.warranty_duration == null || body.warranty_duration === ""
        ? null
        : String(body.warranty_duration).slice(0, 64);

    if (
      body.battery_percentage !== undefined &&
      body.battery_percentage !== null &&
      body.battery_percentage !== ""
    ) {
      const n = parseInt(body.battery_percentage, 10);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        errors.push("battery_percentage must be between 0 and 100");
      } else normalized.battery_percentage = n;
    } else normalized.battery_percentage = null;

    normalized.issues =
      body.issues == null || body.issues === "" ? null : String(body.issues);

    const img = normalizeImages(body.product_images);
    if (!img.ok) errors.push(img.error);
    else normalized.product_images = img.value;

    normalized.purchased_from =
      body.purchased_from == null || body.purchased_from === ""
        ? null
        : String(body.purchased_from).slice(0, 255);
    normalized.stock_reference =
      body.stock_reference == null || body.stock_reference === ""
        ? null
        : String(body.stock_reference).slice(0, 64);

    if (
      body.sold_at !== undefined &&
      body.sold_at !== null &&
      body.sold_at !== ""
    ) {
      const d = new Date(body.sold_at);
      if (Number.isNaN(d.getTime()))
        errors.push("sold_at must be a valid date");
      else normalized.sold_at = d;
    }
  } else {
    if (body.name !== undefined) {
      if (!String(body.name).trim()) errors.push("name cannot be empty");
      else if (String(body.name).length > 255) {
        errors.push("name must be at most 255 characters");
      } else normalized.name = String(body.name).trim();
    }
    if (body.brand_id !== undefined) {
      const bid = requirePositiveInt(body.brand_id, "brand_id", true);
      if (!bid.ok) errors.push(bid.error);
      else normalized.brand_id = bid.value;
    }
    if (body.model_id !== undefined) {
      const mid = requirePositiveInt(body.model_id, "model_id", true);
      if (!mid.ok) errors.push(mid.error);
      else normalized.model_id = mid.value;
    }
    if (body.description !== undefined) {
      normalized.description =
        body.description === null || body.description === ""
          ? null
          : String(body.description);
      if (normalized.description && normalized.description.length > 65535) {
        errors.push("description is too long");
      }
    }
    if (body.variant !== undefined) {
      normalized.variant =
        body.variant === null || body.variant === ""
          ? null
          : String(body.variant).slice(0, 128);
    }
    for (const key of [
      "purchase_price",
      "additional_charges",
      "minimum_selling_price",
    ]) {
      if (body[key] !== undefined) {
        const r = optionalDecimal(body[key], key);
        if (!r.ok) errors.push(r.error);
        else normalized[key] = r.value;
      }
    }
    if (body.imei_number !== undefined) {
      normalized.imei_number =
        body.imei_number === null || body.imei_number === ""
          ? null
          : String(body.imei_number).replace(/\s/g, "").slice(0, 20);
    }
    if (body.color !== undefined) {
      normalized.color =
        body.color === null || body.color === ""
          ? null
          : String(body.color).slice(0, 64);
    }
    if (body.network_type !== undefined) {
      normalized.network_type =
        body.network_type === null || body.network_type === ""
          ? null
          : String(body.network_type).slice(0, 64);
    }
    for (const key of [
      "is_new",
      "charger_available",
      "box_available",
      "is_sold",
    ]) {
      if (body[key] !== undefined) {
        const b = parseBool(body[key]);
        if (!b.ok) errors.push(`${key} must be a boolean`);
        else normalized[key] = b.value;
      }
    }
    if (body.warranty_available_time !== undefined) {
      normalized.warranty_available_time =
        body.warranty_available_time === null ||
        body.warranty_available_time === ""
          ? null
          : String(body.warranty_available_time).slice(0, 32);
    }
    if (body.warranty_duration !== undefined) {
      normalized.warranty_duration =
        body.warranty_duration === null || body.warranty_duration === ""
          ? null
          : String(body.warranty_duration).slice(0, 64);
    }
    if (body.battery_percentage !== undefined) {
      if (body.battery_percentage === null || body.battery_percentage === "") {
        normalized.battery_percentage = null;
      } else {
        const n = parseInt(body.battery_percentage, 10);
        if (Number.isNaN(n) || n < 0 || n > 100) {
          errors.push("battery_percentage must be between 0 and 100");
        } else normalized.battery_percentage = n;
      }
    }
    if (body.issues !== undefined) {
      normalized.issues =
        body.issues === null || body.issues === "" ? null : String(body.issues);
    }
    if (body.product_images !== undefined) {
      const img = normalizeImages(body.product_images);
      if (!img.ok) errors.push(img.error);
      else normalized.product_images = img.value;
    }
    if (body.purchased_from !== undefined) {
      normalized.purchased_from =
        body.purchased_from === null || body.purchased_from === ""
          ? null
          : String(body.purchased_from).slice(0, 255);
    }
    if (body.stock_reference !== undefined) {
      normalized.stock_reference =
        body.stock_reference === null || body.stock_reference === ""
          ? null
          : String(body.stock_reference).slice(0, 64);
    }
    if (body.sold_at !== undefined) {
      if (body.sold_at === null || body.sold_at === "") {
        normalized.sold_at = null;
      } else {
        const d = new Date(body.sold_at);
        if (Number.isNaN(d.getTime()))
          errors.push("sold_at must be a valid date");
        else normalized.sold_at = d;
      }
    }

    if (errors.length === 0 && Object.keys(normalized).length === 0) {
      errors.push("No fields to update");
    }
  }

  return { isValid: errors.length === 0, errors, normalized };
}

module.exports = { validateProductPayload };
