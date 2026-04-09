function validateBrandPayload(body, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (!body.name || String(body.name).trim().length === 0) {
      errors.push("name is required");
    } else if (String(body.name).length > 255) {
      errors.push("name must be at most 255 characters");
    }
  } else {
    if (body.name !== undefined && String(body.name).trim().length === 0) {
      errors.push("name cannot be empty");
    }
    if (body.name != null && String(body.name).length > 255) {
      errors.push("name must be at most 255 characters");
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (String(body.description).length > 65535) {
      errors.push("description is too long");
    }
  }

  if (body.logo !== undefined && body.logo !== null && body.logo !== "") {
    if (String(body.logo).length > 512) {
      errors.push("logo must be at most 512 characters");
    }
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = { validateBrandPayload };
