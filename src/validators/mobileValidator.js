/**
 * User mobile: exactly 10 digits after normalizing optional +91 / leading 0.
 */

function normalizeUserMobile(input) {
  const raw = String(input ?? "")
    .trim()
    .replace(/[\s\-.\u00a0()]/g, "");
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * @param {unknown} mobile
 * @param {{ required?: boolean }} [options]
 * @returns {string[]} error messages (empty if valid)
 */
function getMobileValidationErrors(mobile, { required = true } = {}) {
  const errors = [];
  if (mobile === undefined || mobile === null || String(mobile).trim() === "") {
    if (required) errors.push("Mobile number is required");
    return errors;
  }
  const digits = normalizeUserMobile(mobile);
  if (digits.length !== 10) {
    errors.push("Mobile number must be exactly 10 digits");
    return errors;
  }
  return errors;
}

module.exports = {
  normalizeUserMobile,
  getMobileValidationErrors,
};
