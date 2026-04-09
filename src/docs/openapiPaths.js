/**
 * Supplemental OpenAPI paths (routes mounted in index.js and other gaps).
 * @swagger
 * tags:
 *   - name: API
 *     description: Root and discovery
 *   - name: AuthPublic
 *     description: Unauthenticated auth flows (login, register, password reset)
 *   - name: Organisations
 *     description: Organisation CRUD (super admin) and current org
 *   - name: Media
 *     description: File uploads and public file access
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API welcome (mounted under /api)
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Basic API info
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Sign in (sets httpOnly cookies; Bearer token may also be returned in body)
 *     tags: [AuthPublic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or mobile
 *               password:
 *                 type: string
 *               device_id:
 *                 type: string
 *               device_type:
 *                 type: string
 *                 example: WEB
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Sign out (clears session cookies)
 *     tags: [AuthPublic]
 *     responses:
 *       200:
 *         description: Logged out
 */

/**
 * @swagger
 * /api/v1/auth/register/request-otp:
 *   post:
 *     summary: Request registration OTP (email)
 *     tags: [AuthPublic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               expiresInMinutes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/v1/auth/register/verify:
 *   post:
 *     summary: Verify OTP and create ADMIN user
 *     tags: [AuthPublic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, name, mobile, password]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Validation or OTP error
 */

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [AuthPublic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic success (no user enumeration)
 */

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Set new password using token from email
 *     tags: [AuthPublic]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /api/v1/organisations/me:
 *   get:
 *     summary: Current user organisation (super admin returns null org)
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organisation or null for super admin
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No organisation assigned
 */

/**
 * @swagger
 * /api/v1/organisations:
 *   get:
 *     summary: List organisations (paginated)
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: List result
 *       403:
 *         description: Super admin only
 *   post:
 *     summary: Create organisation
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name: { type: string }
 *               type:
 *                 type: string
 *                 enum: [COMPANY, INDIVIDUAL, NON_PROFIT, GOVERNMENT, OTHER]
 *               email: { type: string }
 *               phone: { type: string }
 *               website: { type: string }
 *               logo_url: { type: string }
 *               banner_url: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [ACTIVE, INACTIVE, SUSPENDED] }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/v1/organisations/{id}:
 *   get:
 *     summary: Get organisation by ID
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Organisation
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update organisation
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete organisation
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /api/v1/media/public/{token}:
 *   get:
 *     summary: Download or view file (public, no auth)
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Opaque public_token (URL-safe); legacy numeric id may still work
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File stream
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/v1/media:
 *   get:
 *     summary: List media metadata (SUPER_ADMIN or ADMIN)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: organisation_id
 *         schema: { type: integer }
 *         description: Filter (super admin); admins are scoped to their org
 *     responses:
 *       200:
 *         description: Paginated media list with public_url
 *   post:
 *     summary: Upload file (multipart field `file`)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               organisation_id:
 *                 type: integer
 *                 description: Required when uploader is SUPER_ADMIN
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation or file too large (MEDIA_MAX_UPLOAD_BYTES)
 */

/**
 * @swagger
 * /api/v1/media/{id}:
 *   get:
 *     summary: Get media metadata by ID
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Media record
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update name and/or description
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete media and file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */

module.exports = {};
