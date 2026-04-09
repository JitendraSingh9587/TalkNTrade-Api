function validateBrandModelPayload(body, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (!body.name || String(body.name).trim().length === 0) {
      errors.push("name is required");
    } else if (String(body.name).length > 255) {
      errors.push("name must be at most 255 characters");
    }
    const rawBrand = body.brand_id;
    const n = parseInt(rawBrand, 10);
    if (rawBrand === undefined || rawBrand === null || rawBrand === "") {
      errors.push("brand_id is required");
    } else if (Number.isNaN(n) || n < 1) {
      errors.push("brand_id must be a positive integer");
    }
  } else {
    if (body.name !== undefined && String(body.name).trim().length === 0) {
      errors.push("name cannot be empty");
    }
    if (body.name != null && String(body.name).length > 255) {
      errors.push("name must be at most 255 characters");
    }
    if (
      body.brand_id !== undefined &&
      body.brand_id !== null &&
      body.brand_id !== ""
    ) {
      const n = parseInt(body.brand_id, 10);
      if (Number.isNaN(n) || n < 1) {
        errors.push("brand_id must be a positive integer");
      }
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (String(body.description).length > 65535) {
      errors.push("description is too long");
    }
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = { validateBrandModelPayload };
