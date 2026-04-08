const ORG_TYPES = [
  "COMPANY",
  "INDIVIDUAL",
  "NON_PROFIT",
  "GOVERNMENT",
  "OTHER",
];
const ORG_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function validateOrganisationPayload(data, { partial = false } = {}) {
  const errors = [];

  const requireField = (cond, msg) => {
    if (cond) errors.push(msg);
  };

  if (!partial || data.name !== undefined) {
    if (!data.name || String(data.name).trim().length === 0) {
      errors.push("Organisation name is required");
    } else if (String(data.name).length > 255) {
      errors.push("Organisation name must be at most 255 characters");
    }
  }

  if (data.type !== undefined && data.type !== null && data.type !== "") {
    if (!ORG_TYPES.includes(data.type)) {
      errors.push(`Organisation type must be one of: ${ORG_TYPES.join(", ")}`);
    }
  } else if (!partial) {
    errors.push("Organisation type is required");
  }

  if (data.email !== undefined && data.email !== null && data.email !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid organisation email format");
    }
  }

  if (
    data.phone !== undefined &&
    data.phone != null &&
    data.phone.length > 30
  ) {
    errors.push("Organisation phone must be at most 30 characters");
  }
  if (
    data.website !== undefined &&
    data.website != null &&
    data.website.length > 512
  ) {
    errors.push("Organisation website must be at most 512 characters");
  }
  if (
    data.logo_url !== undefined &&
    data.logo_url != null &&
    data.logo_url.length > 512
  ) {
    errors.push("Organisation logo_url must be at most 512 characters");
  }
  if (
    data.banner_url !== undefined &&
    data.banner_url != null &&
    data.banner_url.length > 512
  ) {
    errors.push("Organisation banner_url must be at most 512 characters");
  }

  if (data.status !== undefined && data.status !== null && data.status !== "") {
    if (!ORG_STATUSES.includes(data.status)) {
      errors.push(
        `Organisation status must be one of: ${ORG_STATUSES.join(", ")}`,
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validateOrganisationPayload,
  ORG_TYPES,
  ORG_STATUSES,
};
