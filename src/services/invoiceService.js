const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { Invoice, Customer, Organisation, Product } = require("../models");
const organisationService = require("./organisationService");
const customerService = require("./customerService");
const { round2 } = require("../validators/invoiceValidator");

function parseId(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    const err = new Error("Invalid id");
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function num(v) {
  return Number(v);
}

function assertActorCanAccessOrg(actor, organisationId) {
  if (actor.role === "SUPER_ADMIN") return;
  const oid =
    actor.organisation_id != null ? parseInt(actor.organisation_id, 10) : null;
  if (oid != null && oid === parseInt(organisationId, 10)) return;
  const err = new Error("You cannot access this organisation's invoices");
  err.statusCode = 403;
  throw err;
}

function resolveListOrganisationScope(actor, query) {
  if (actor.role === "SUPER_ADMIN") {
    const raw = query.organisation_id;
    if (raw === undefined || raw === null || raw === "") {
      return {};
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) {
      const err = new Error("Invalid organisation_id");
      err.statusCode = 400;
      throw err;
    }
    return { organisation_id: n };
  }
  const oid = actor.organisation_id;
  if (oid == null || oid === "") {
    const err = new Error("Your account is not linked to an organisation");
    err.statusCode = 403;
    throw err;
  }
  return { organisation_id: parseInt(oid, 10) };
}

function resolveOrganisationIdForCreate(actor, body) {
  if (actor.role === "SUPER_ADMIN") {
    const raw = body.organisation_id;
    const n = parseInt(raw, 10);
    if (
      raw === undefined ||
      raw === null ||
      raw === "" ||
      Number.isNaN(n) ||
      n < 1
    ) {
      const err = new Error("organisation_id is required for this invoice");
      err.statusCode = 400;
      throw err;
    }
    return n;
  }
  if (
    actor.role === "ADMIN" ||
    actor.role === "SUPERVISOR" ||
    actor.role === "USER"
  ) {
    if (!actor.organisation_id) {
      const err = new Error("Your account is not linked to an organisation");
      err.statusCode = 403;
      throw err;
    }
    return parseInt(actor.organisation_id, 10);
  }
  const err = new Error("You are not allowed to create invoices");
  err.statusCode = 403;
  throw err;
}

function assertAmountConsistency(total, discount, finalAmt) {
  const t = round2(num(total));
  const d = round2(num(discount));
  const f = round2(num(finalAmt));
  if (d > t + 0.02) {
    const err = new Error("discount_amount cannot exceed total_amount");
    err.statusCode = 400;
    throw err;
  }
  if (Math.abs(round2(t - d) - f) > 0.02) {
    const err = new Error(
      "final_amount must equal total_amount minus discount_amount (within 0.02)",
    );
    err.statusCode = 400;
    throw err;
  }
  return { total_amount: t, discount_amount: d, final_amount: f };
}

function derivePaidAndStatus(finalAmt, paidAmt) {
  const final = round2(num(finalAmt));
  let paid = round2(num(paidAmt));
  if (paid < 0) paid = 0;
  const remaining = Math.max(0, round2(final - paid));
  let payment_status;
  if (final <= 0) {
    payment_status = paid > 0.005 ? "PAID" : "UNPAID";
  } else if (paid + 1e-6 >= final) {
    payment_status = "PAID";
  } else if (paid > 0.005) {
    payment_status = "PARTIAL";
  } else {
    payment_status = "UNPAID";
  }
  return { paid_amount: paid, remaining_amount: remaining, payment_status };
}

async function assertCustomerBelongsToOrg(customerId, orgId) {
  const c = await Customer.findByPk(customerId);
  if (!c) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  if (parseInt(c.organisation_id, 10) !== parseInt(orgId, 10)) {
    const err = new Error("customer_id does not belong to this organisation");
    err.statusCode = 400;
    throw err;
  }
}

async function assertUniqueInvoiceNumber(orgId, invoiceNumber, excludeId, transaction) {
  const where = {
    organisation_id: orgId,
    invoice_number: invoiceNumber,
  };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const existing = await Invoice.findOne({ where, transaction });
  if (existing) {
    const err = new Error("invoice_number already exists for this organisation");
    err.statusCode = 409;
    throw err;
  }
}

const customerInclude = {
  model: Customer,
  as: "customer",
  attributes: [
    "id",
    "full_name",
    "phone",
    "email",
    "company_name",
    "organisation_id",
  ],
};

const productInclude = {
  model: Product,
  as: "product",
  attributes: [
    "id",
    "name",
    "organisation_id",
    "minimum_selling_price",
    "mrp",
    "purchase_price",
    "is_sold",
  ],
};

function assertCanRecordProductSale(actor) {
  const ok = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USER"].includes(actor.role);
  if (!ok) {
    const err = new Error("You are not allowed to record a product sale");
    err.statusCode = 403;
    throw err;
  }
}

/** Invoice line total defaults to MRP, then min sale price, then purchase price. */
function defaultSalePriceFromProduct(product) {
  const pick = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return (
    pick(product.mrp) ??
    pick(product.minimum_selling_price) ??
    pick(product.purchase_price) ??
    0
  );
}

/**
 * USER and SUPERVISOR may set sale total between minimum selling price and MRP (inclusive).
 * ADMIN and SUPER_ADMIN are not limited here.
 */
function assertProductSaleTotalForRole(actor, product, totalAmount) {
  if (actor.role !== "USER" && actor.role !== "SUPERVISOR") return;

  const t = round2(num(totalAmount));
  const msp = pickPositiveMoney(product.minimum_selling_price);
  const mrp = pickPositiveMoney(product.mrp);

  if (msp != null && mrp != null && mrp >= msp) {
    if (t + 1e-6 < msp || t > mrp + 0.02) {
      const err = new Error(
        `Invoice total must be between minimum sale price (${msp}) and MRP (${mrp}) for your role`,
      );
      err.statusCode = 400;
      throw err;
    }
    return;
  }
  if (msp != null && t + 1e-6 < msp) {
    const err = new Error(
      `Invoice total cannot be below the minimum sale price (${msp}) for your role`,
    );
    err.statusCode = 400;
    throw err;
  }
  if (mrp != null && t > mrp + 0.02) {
    const err = new Error(
      `Invoice total cannot exceed MRP (${mrp}) for your role`,
    );
    err.statusCode = 400;
    throw err;
  }
}

function pickPositiveMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return round2(n);
}

const listInvoices = async (actor, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const orgWhere = resolveListOrganisationScope(actor, query);
  const where = { ...orgWhere };

  if (query.customer_id) {
    const cid = parseInt(query.customer_id, 10);
    if (!Number.isNaN(cid) && cid >= 1) where.customer_id = cid;
  }
  if (query.product_id) {
    const pid = parseInt(query.product_id, 10);
    if (!Number.isNaN(pid) && pid >= 1) where.product_id = pid;
  }
  if (query.payment_status) {
    const s = String(query.payment_status).trim().toUpperCase();
    if (s === "PAID" || s === "PARTIAL" || s === "UNPAID") {
      where.payment_status = s;
    }
  }
  const search = query.search ? String(query.search).trim() : "";
  if (search) {
    where.invoice_number = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Invoice.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      customerInclude,
      productInclude,
    ],
  });

  return {
    invoices: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

const createInvoice = async (actor, normalized, rawBody) => {
  const orgId = resolveOrganisationIdForCreate(actor, rawBody);
  await organisationService.requireActiveOrganisation(orgId);
  assertActorCanAccessOrg(actor, orgId);

  await assertCustomerBelongsToOrg(normalized.customer_id, orgId);
  await assertUniqueInvoiceNumber(orgId, normalized.invoice_number);

  const amounts = assertAmountConsistency(
    normalized.total_amount,
    normalized.discount_amount,
    normalized.final_amount,
  );
  const paidDerived = derivePaidAndStatus(
    amounts.final_amount,
    normalized.paid_amount,
  );

  return Invoice.create({
    organisation_id: orgId,
    invoice_number: normalized.invoice_number,
    customer_id: normalized.customer_id,
    product_id: normalized.product_id ?? null,
    total_amount: amounts.total_amount,
    discount_amount: amounts.discount_amount,
    final_amount: amounts.final_amount,
    paid_amount: paidDerived.paid_amount,
    remaining_amount: paidDerived.remaining_amount,
    payment_status: paidDerived.payment_status,
    payment_mode: normalized.payment_mode,
    notes: normalized.notes,
  });
};

const getInvoiceById = async (actor, rawId) => {
  const id = parseId(rawId);
  const row = await Invoice.findByPk(id, {
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      customerInclude,
      productInclude,
    ],
  });
  if (!row) {
    const err = new Error("Invoice not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, row.organisation_id);
  return row;
};

const updateInvoice = async (actor, rawId, normalized, _rawBody) => {
  const invoice = await Invoice.findByPk(parseId(rawId));
  if (!invoice) {
    const err = new Error("Invoice not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, invoice.organisation_id);

  if (
    actor.role !== "SUPER_ADMIN" &&
    actor.role !== "ADMIN" &&
    actor.role !== "SUPERVISOR" &&
    actor.role !== "USER"
  ) {
    const err = new Error("You are not allowed to update invoices");
    err.statusCode = 403;
    throw err;
  }

  const orgId = invoice.organisation_id;
  const nextCustomerId = normalized.customer_id ?? invoice.customer_id;
  await assertCustomerBelongsToOrg(nextCustomerId, orgId);

  const nextNumber = normalized.invoice_number ?? invoice.invoice_number;
  if (nextNumber !== invoice.invoice_number) {
    await assertUniqueInvoiceNumber(orgId, nextNumber, invoice.id);
  }

  const total =
    normalized.total_amount !== undefined
      ? normalized.total_amount
      : invoice.total_amount;
  const discount =
    normalized.discount_amount !== undefined
      ? normalized.discount_amount
      : invoice.discount_amount;
  const finalAmt =
    normalized.final_amount !== undefined
      ? normalized.final_amount
      : invoice.final_amount;
  const amounts = assertAmountConsistency(total, discount, finalAmt);

  const paidRaw =
    normalized.paid_amount !== undefined
      ? normalized.paid_amount
      : invoice.paid_amount;
  const paidDerived = derivePaidAndStatus(amounts.final_amount, paidRaw);

  const payload = {
    invoice_number: nextNumber,
    customer_id: nextCustomerId,
    total_amount: amounts.total_amount,
    discount_amount: amounts.discount_amount,
    final_amount: amounts.final_amount,
    paid_amount: paidDerived.paid_amount,
    remaining_amount: paidDerived.remaining_amount,
    payment_status: paidDerived.payment_status,
    ...(normalized.payment_mode !== undefined
      ? { payment_mode: normalized.payment_mode }
      : {}),
    ...(normalized.notes !== undefined ? { notes: normalized.notes } : {}),
  };

  await invoice.update(payload);
  await invoice.reload({
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      customerInclude,
      productInclude,
    ],
  });
  return invoice;
};

/**
 * Upsert customer by mobile (same org), create invoice linked to product, mark product sold.
 * @param {object} validated — output of validateProductSalePayload.normalized + nested customer
 */
const createInvoiceFromProductSale = async (actor, validated) => {
  assertCanRecordProductSale(actor);
  const {
    product_id,
    customer: customerNorm,
    discount_amount,
    paid_amount,
    payment_mode,
    invoice_number,
    invoice_notes,
    organisation_id: bodyOrgId,
    total_amount: bodyTotal,
    final_amount: bodyFinal,
  } = validated;

  return sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(product_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }
    if (product.is_sold) {
      const err = new Error("Product is already marked as sold");
      err.statusCode = 400;
      throw err;
    }

    const orgId = parseInt(product.organisation_id, 10);
    assertActorCanAccessOrg(actor, orgId);
    if (
      actor.role === "SUPER_ADMIN" &&
      bodyOrgId != null &&
      parseInt(bodyOrgId, 10) !== orgId
    ) {
      const err = new Error(
        "organisation_id does not match this product's organisation",
      );
      err.statusCode = 400;
      throw err;
    }

    const upsert = await customerService.upsertCustomerByMobileForOrg(
      actor,
      orgId,
      customerNorm,
      { transaction },
    );
    const customer = upsert.customer;

    let total_amount = bodyTotal;
    if (total_amount === undefined || total_amount === null) {
      total_amount = defaultSalePriceFromProduct(product);
      if (!total_amount || total_amount <= 0) {
        const err = new Error(
          "total_amount is required when the product has no MRP, minimum sale price, or purchase price",
        );
        err.statusCode = 400;
        throw err;
      }
    }

    assertProductSaleTotalForRole(actor, product, total_amount);

    const discount = discount_amount ?? 0;
    let final_amount = bodyFinal;
    if (final_amount === undefined || final_amount === null) {
      final_amount = round2(total_amount - discount);
    }

    const amounts = assertAmountConsistency(total_amount, discount, final_amount);
    const paidDerived = derivePaidAndStatus(amounts.final_amount, paid_amount);

    let invNo = invoice_number;
    if (!invNo) {
      invNo = `SALE-${product.id}-${Date.now()}`;
    }
    await assertUniqueInvoiceNumber(orgId, invNo, null, transaction);

    const invoice = await Invoice.create(
      {
        organisation_id: orgId,
        invoice_number: invNo,
        customer_id: customer.id,
        product_id: product.id,
        total_amount: amounts.total_amount,
        discount_amount: amounts.discount_amount,
        final_amount: amounts.final_amount,
        paid_amount: paidDerived.paid_amount,
        remaining_amount: paidDerived.remaining_amount,
        payment_status: paidDerived.payment_status,
        payment_mode,
        notes: invoice_notes,
      },
      { transaction },
    );

    await product.update(
      { is_sold: true, sold_at: new Date() },
      { transaction },
    );

    await invoice.reload({
      transaction,
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name"],
        },
        customerInclude,
        productInclude,
      ],
    });

    return {
      invoice,
      customer: {
        id: customer.id,
        created: upsert.created,
        updated: upsert.updated,
      },
      product: { id: product.id, is_sold: true },
    };
  });
};

const deleteInvoice = async (actor, rawId) => {
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    const err = new Error("Only administrators can archive invoices");
    err.statusCode = 403;
    throw err;
  }

  const invoice = await Invoice.findByPk(parseId(rawId));
  if (!invoice) {
    const err = new Error("Invoice not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, invoice.organisation_id);
  await invoice.destroy();
  return { success: true };
};

module.exports = {
  listInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  createInvoiceFromProductSale,
};
