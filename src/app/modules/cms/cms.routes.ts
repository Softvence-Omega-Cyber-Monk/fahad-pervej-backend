import { Router } from 'express';
import { CMSController } from './cms.controller';
import { validateCMSPage, validateCMSPageUpdate } from '../../validators/cms.validators';

const router = Router();
const cmsController = new CMSController();

/**
 * @swagger
 * tags:
 *   name: CMS
 *   description: Content Management System endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CMSPage:
 *       type: object
 *       properties:
 *         pageId:
 *           type: integer
 *           description: Unique identifier for the CMS page
 *           example: 101
 *         pageTitle:
 *           type: string
 *           description: Title of the CMS page
 *           example: About Us
 *         urlKey:
 *           type: string
 *           description: URL-friendly key for the page
 *           example: about-us
 *         content:
 *           type: string
 *           description: Main content of the CMS page
 *           example: This page provides detailed company information.
 *         mainTitle:
 *           type: string
 *           description: Main heading displayed on the page
 *           example: Welcome to Our Company
 *         metaKeywords:
 *           type: string
 *           description: SEO meta keywords
 *           example: about, company, team
 *         metaDescription:
 *           type: string
 *           description: SEO meta description
 *           example: Learn about our mission, vision, and team.
 *         isActive:
 *           type: boolean
 *           description: Page active status
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Page creation timestamp
 *           example: 2025-10-06T12:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: 2025-10-07T09:00:00Z
 *
 *     CreateCMSPageInput:
 *       type: object
 *       required:
 *         - pageTitle
 *         - urlKey
 *         - content
 *         - mainTitle
 *         - metaKeywords
 *         - metaDescription
 *       properties:
 *         pageTitle:
 *           type: string
 *           description: Title of the CMS page
 *           example: Contact Us
 *         urlKey:
 *           type: string
 *           description: URL-friendly key (must be unique)
 *           example: contact-us
 *         content:
 *           type: string
 *           description: Main content of the page
 *           example: Reach out to our support team for any inquiries.
 *         mainTitle:
 *           type: string
 *           description: Main heading for the page
 *           example: Get in Touch
 *         metaKeywords:
 *           type: string
 *           description: SEO meta keywords
 *           example: contact, help, support
 *         metaDescription:
 *           type: string
 *           description: SEO meta description
 *           example: Contact our support team for assistance
 *         isActive:
 *           type: boolean
 *           description: Set page active status (default true)
 *           example: true
 *
 *     UpdateCMSPageInput:
 *       type: object
 *       properties:
 *         pageTitle:
 *           type: string
 *           description: Updated page title
 *           example: Contact Support
 *         urlKey:
 *           type: string
 *           description: Updated URL key
 *           example: contact-support
 *         content:
 *           type: string
 *           description: Updated page content
 *           example: Updated content for contact page with new information.
 *         mainTitle:
 *           type: string
 *           description: Updated main heading
 *           example: Contact Our Support Team
 *         metaKeywords:
 *           type: string
 *           description: Updated meta keywords
 *           example: contact, support, help, assistance
 *         metaDescription:
 *           type: string
 *           description: Updated meta description
 *           example: Reach out to our support team
 *         isActive:
 *           type: boolean
 *           description: Updated active status
 *           example: true
 *
 *     PaginatedCMSResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Pages retrieved successfully
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CMSPage'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 50
 *             totalPages:
 *               type: integer
 *               example: 5
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operation completed successfully
 *         data:
 *           $ref: '#/components/schemas/CMSPage'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error message description
 */

/**
 * @swagger
 * /cms:
 *   get:
 *     summary: Get all CMS pages
 *     description: Retrieve a paginated list of CMS pages with optional filtering and sorting
 *     tags: [CMS]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for page title or URL key
 *         example: about
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [pageId, pageTitle, urlKey, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *         example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *         example: desc
 *     responses:
 *       200:
 *         description: List of CMS pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCMSResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', cmsController.getAllPages);

/**
 * @swagger
 * /cms/{id}:
 *   get:
 *     summary: Get CMS page by ID
 *     description: Retrieve a specific CMS page using its unique identifier
 *     tags: [CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: CMS page ID
 *         example: 101
 *     responses:
 *       200:
 *         description: CMS page retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', cmsController.getPageById);

/**
 * @swagger
 * /cms/url/{urlKey}:
 *   get:
 *     summary: Get CMS page by URL key
 *     description: Retrieve a specific CMS page using its URL-friendly key
 *     tags: [CMS]
 *     parameters:
 *       - in: path
 *         name: urlKey
 *         schema:
 *           type: string
 *         required: true
 *         description: CMS page URL key
 *         example: about-us
 *     responses:
 *       200:
 *         description: CMS page retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/url/:urlKey', cmsController.getPageByUrlKey);

/**
 * @swagger
 * /cms:
 *   post:
 *     summary: Create a new CMS page
 *     description: Create a new CMS page with title, content, and SEO metadata
 *     tags: [CMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCMSPageInput'
 *     responses:
 *       201:
 *         description: Page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - URL key already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateCMSPage, cmsController.createPage);

/**
 * @swagger
 * /cms/{id}:
 *   put:
 *     summary: Update an existing CMS page
 *     description: Update one or more fields of an existing CMS page
 *     tags: [CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: CMS page ID
 *         example: 101
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCMSPageInput'
 *     responses:
 *       200:
 *         description: Page updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - URL key already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', validateCMSPageUpdate, cmsController.updatePage);

/**
 * @swagger
 * /cms/{id}:
 *   delete:
 *     summary: Delete a CMS page by ID
 *     description: Permanently delete a CMS page using its unique identifier
 *     tags: [CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: CMS page ID to delete
 *         example: 101
 *     responses:
 *       200:
 *         description: Page deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Page deleted successfully
 *       404:
 *         description: Page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', cmsController.deletePage);

/**
 * @swagger
 * /cms/bulk/delete:
 *   delete:
 *     summary: Delete multiple CMS pages
 *     description: Delete multiple CMS pages in a single operation using their IDs
 *     tags: [CMS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of CMS page IDs to delete
 *                 example: [1, 2, 3, 5, 8]
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Pages deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pages deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Validation error - invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/bulk/delete', cmsController.deletePages);

/**
 * @swagger
 * /cms/{id}/toggle-status:
 *   patch:
 *     summary: Toggle CMS page active status
 *     description: Toggle the isActive status of a CMS page (active to inactive or vice versa)
 *     tags: [CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: CMS page ID
 *         example: 101
 *     responses:
 *       200:
 *         description: Page status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/toggle-status', cmsController.togglePageStatus);

export const CMSRoutes = router;