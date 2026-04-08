const { User, Organisation } = require("../models");
const { Op } = require("sequelize");
const { hashPassword } = require("../shared/utils/password");
const organisationService = require("./organisationService");
const { normalizeUserMobile } = require("../validators/mobileValidator");

const organisationInclude = {
  model: Organisation,
  as: "organisation",
  attributes: ["id", "name", "status", "type"],
};

function assertSuperAdminOnlyForTarget(actorRole, targetRole, actionLabel) {
  if (targetRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    const error = new Error(
      `Only a super admin can ${actionLabel} a super admin account`,
    );
    error.statusCode = 403;
    throw error;
  }
}

function assertAdminSameOrganisation(
  actorRole,
  actorOrgId,
  targetUser,
  actionLabel,
) {
  if (actorRole !== "ADMIN") return;
  if (!actorOrgId) {
    const error = new Error("Your account is not linked to an organisation");
    error.statusCode = 403;
    throw error;
  }
  if (targetUser.organisation_id !== actorOrgId) {
    const error = new Error(
      `You cannot ${actionLabel} users outside your organisation`,
    );
    error.statusCode = 403;
    throw error;
  }
}

/**
 * @param {Object} filters
 * @param {Object} pagination
 * @param {{ role?: string, organisation_id?: number|null }} actor
 */
const getAllUsers = async (filters = {}, pagination = {}, actor = {}) => {
  const { role, is_disabled, search, organisation_id: filterOrgId } = filters;
  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const where = {};

  if (actor.role === "ADMIN") {
    if (!actor.organisation_id) {
      const error = new Error("Your account is not linked to an organisation");
      error.statusCode = 403;
      throw error;
    }
    where.organisation_id = actor.organisation_id;
  } else if (actor.role === "SUPER_ADMIN" && filterOrgId) {
    where.organisation_id = parseInt(filterOrgId, 10);
  }

  if (role) {
    where.role = role;
  }

  if (is_disabled !== undefined) {
    where.is_disabled = is_disabled === "true" || is_disabled === true;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { mobile: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    attributes: { exclude: ["password"] },
    include: [organisationInclude],
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * @param {number|string} id
 * @param {{ role?: string, organisation_id?: number|null }} actor
 */
const getUserById = async (id, actor = {}) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
    include: [organisationInclude],
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  assertAdminSameOrganisation(actor.role, actor.organisation_id, user, "view");

  return user;
};

/**
 * @param {Object} userData
 * @param {{ role?: string, id?: number, organisation_id?: number|null }} actor
 */
const createUser = async (userData, actor = {}) => {
  const actorRole = actor.role ?? null;
  const actorOrgId = actor.organisation_id ?? null;

  if (actorRole === "ADMIN" && userData.role === "SUPER_ADMIN") {
    const error = new Error(
      "Only a super admin can create super admin accounts",
    );
    error.statusCode = 403;
    throw error;
  }

  const targetRole = userData.role;
  const rawOrgId = userData.organisation_id;
  const bodyOrgId =
    rawOrgId !== undefined && rawOrgId !== null && rawOrgId !== ""
      ? parseInt(rawOrgId, 10)
      : null;

  const payload = { ...userData };
  delete payload.organisation_id; // set explicitly after resolution

  let finalOrgId = null;

  if (targetRole === "SUPER_ADMIN") {
    if (bodyOrgId != null && !Number.isNaN(bodyOrgId)) {
      const error = new Error(
        "Super admin users cannot be assigned to an organisation",
      );
      error.statusCode = 400;
      throw error;
    }
    finalOrgId = null;
  } else {
    if (actorRole === "SUPER_ADMIN") {
      if (!bodyOrgId || Number.isNaN(bodyOrgId)) {
        const error = new Error(
          "organisation_id is required and must reference an existing active organisation",
        );
        error.statusCode = 400;
        throw error;
      }
      await organisationService.requireActiveOrganisation(bodyOrgId);
      finalOrgId = bodyOrgId;
    } else if (actorRole === "ADMIN") {
      if (!actorOrgId) {
        const error = new Error(
          "Your account is not linked to an organisation",
        );
        error.statusCode = 403;
        throw error;
      }
      if (
        bodyOrgId != null &&
        !Number.isNaN(bodyOrgId) &&
        bodyOrgId !== actorOrgId
      ) {
        const error = new Error(
          "You cannot assign users to another organisation",
        );
        error.statusCode = 403;
        throw error;
      }
      await organisationService.requireActiveOrganisation(actorOrgId);
      finalOrgId = actorOrgId;
    }
  }

  const existingUserByEmail = await User.findOne({
    where: { email: userData.email },
  });

  if (existingUserByEmail) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const mobileNormalized = normalizeUserMobile(userData.mobile);
  const existingUserByMobile = await User.findOne({
    where: { mobile: mobileNormalized },
  });

  if (existingUserByMobile) {
    const error = new Error("Mobile number already exists");
    error.statusCode = 409;
    throw error;
  }

  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  }

  payload.is_email_verified = true;
  payload.is_mobile_verified = true;
  payload.organisation_id = finalOrgId;
  payload.mobile = mobileNormalized;

  const user = await User.create(payload);

  const withOrg = await User.findByPk(user.id, {
    attributes: { exclude: ["password"] },
    include: [organisationInclude],
  });

  return withOrg.toJSON();
};

/**
 * @param {Object} actor
 */
const updateUser = async (id, updateData, currentUserId = null, actor = {}) => {
  const user = await User.findByPk(id, { include: [organisationInclude] });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const actorRole = actor.role ?? null;
  const actorOrgId = actor.organisation_id ?? null;

  assertAdminSameOrganisation(actorRole, actorOrgId, user, "modify");

  if (actorRole === "ADMIN" && user.role === "SUPER_ADMIN") {
    const error = new Error("Admins cannot modify super admin accounts");
    error.statusCode = 403;
    throw error;
  }

  if (actorRole === "ADMIN" && updateData.role === "SUPER_ADMIN") {
    const error = new Error(
      "Only a super admin can assign the super admin role",
    );
    error.statusCode = 403;
    throw error;
  }

  if (
    user.role === "SUPER_ADMIN" &&
    currentUserId &&
    parseInt(id, 10) === parseInt(currentUserId, 10) &&
    updateData.role &&
    updateData.role !== user.role
  ) {
    const error = new Error("Super admin cannot change their own role");
    error.statusCode = 403;
    throw error;
  }

  if (updateData.role === "SUPER_ADMIN") {
    updateData.organisation_id = null;
  }

  if (actorRole === "ADMIN") {
    delete updateData.organisation_id;
  }

  if (updateData.organisation_id !== undefined) {
    if (user.role === "SUPER_ADMIN") {
      const error = new Error("Cannot assign an organisation to a super admin");
      error.statusCode = 400;
      throw error;
    }
    const oid = parseInt(updateData.organisation_id, 10);
    if (Number.isNaN(oid)) {
      const error = new Error("Invalid organisation_id");
      error.statusCode = 400;
      throw error;
    }
    await organisationService.requireActiveOrganisation(oid);
    updateData.organisation_id = oid;
  }

  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({
      where: { email: updateData.email },
    });

    if (existingUser) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  if (
    updateData.mobile !== undefined &&
    String(updateData.mobile).trim() !== ""
  ) {
    updateData.mobile = normalizeUserMobile(updateData.mobile);
  }

  if (updateData.mobile && updateData.mobile !== user.mobile) {
    const existingUser = await User.findOne({
      where: { mobile: updateData.mobile },
    });

    if (existingUser) {
      const error = new Error("Mobile number already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  await user.update(updateData);

  const refreshed = await User.findByPk(user.id, {
    attributes: { exclude: ["password"] },
    include: [organisationInclude],
  });

  return refreshed.toJSON();
};

const disableUser = async (
  id,
  disabledBy = null,
  actorRole = null,
  actorOrgId = null,
) => {
  const user = await User.findByPk(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  assertSuperAdminOnlyForTarget(actorRole, user.role, "disable");
  assertAdminSameOrganisation(actorRole, actorOrgId, user, "disable");

  if (user.is_disabled) {
    const error = new Error("User is already disabled");
    error.statusCode = 400;
    throw error;
  }

  await user.update({
    is_disabled: true,
    disabled_at: new Date(),
    disabled_by: disabledBy,
  });

  const withOrg = await User.findByPk(user.id, {
    attributes: { exclude: ["password"] },
    include: [organisationInclude],
  });
  return withOrg.toJSON();
};

const enableUser = async (id, actorRole = null, actorOrgId = null) => {
  const user = await User.findByPk(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  assertSuperAdminOnlyForTarget(actorRole, user.role, "enable");
  assertAdminSameOrganisation(actorRole, actorOrgId, user, "enable");

  if (!user.is_disabled) {
    const error = new Error("User is already enabled");
    error.statusCode = 400;
    throw error;
  }

  await user.update({
    is_disabled: false,
    disabled_at: null,
    disabled_by: null,
  });

  const withOrg = await User.findByPk(user.id, {
    attributes: { exclude: ["password"] },
    include: [organisationInclude],
  });
  return withOrg.toJSON();
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  enableUser,
};
