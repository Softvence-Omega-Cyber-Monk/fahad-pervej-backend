"use strict";
// src/validators/cms.validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCMSPageUpdate = exports.validateCMSPage = void 0;
// Validation middleware for creating CMS page
const validateCMSPage = (req, res, next) => {
    const { pageTitle, urlKey, content, mainTitle, metaKeywords, metaDescription } = req.body;
    const errors = [];
    // Required fields
    if (!pageTitle || pageTitle.trim().length === 0) {
        errors.push('Page title is required');
    }
    else if (pageTitle.length > 200) {
        errors.push('Page title cannot exceed 200 characters');
    }
    if (!urlKey || urlKey.trim().length === 0) {
        errors.push('URL key is required');
    }
    else if (!/^[a-z0-9-]+$/.test(urlKey)) {
        errors.push('URL key can only contain lowercase letters, numbers, and hyphens');
    }
    if (!content || content.trim().length === 0) {
        errors.push('Content is required');
    }
    if (!mainTitle || mainTitle.trim().length === 0) {
        errors.push('Main title is required');
    }
    else if (mainTitle.length > 300) {
        errors.push('Main title cannot exceed 300 characters');
    }
    // Optional fields validation
    if (metaKeywords && metaKeywords.length > 500) {
        errors.push('Meta keywords cannot exceed 500 characters');
    }
    if (metaDescription && metaDescription.length > 1000) {
        errors.push('Meta description cannot exceed 1000 characters');
    }
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }
    next();
};
exports.validateCMSPage = validateCMSPage;
// Validation middleware for updating CMS page
const validateCMSPageUpdate = (req, res, next) => {
    const { pageTitle, urlKey, mainTitle, metaKeywords, metaDescription } = req.body;
    const errors = [];
    // Validate only if fields are provided
    if (pageTitle !== undefined) {
        if (pageTitle.trim().length === 0) {
            errors.push('Page title cannot be empty');
        }
        else if (pageTitle.length > 200) {
            errors.push('Page title cannot exceed 200 characters');
        }
    }
    if (urlKey !== undefined) {
        if (urlKey.trim().length === 0) {
            errors.push('URL key cannot be empty');
        }
        else if (!/^[a-z0-9-]+$/.test(urlKey)) {
            errors.push('URL key can only contain lowercase letters, numbers, and hyphens');
        }
    }
    if (mainTitle !== undefined) {
        if (mainTitle.trim().length === 0) {
            errors.push('Main title cannot be empty');
        }
        else if (mainTitle.length > 300) {
            errors.push('Main title cannot exceed 300 characters');
        }
    }
    if (metaKeywords !== undefined && metaKeywords.length > 500) {
        errors.push('Meta keywords cannot exceed 500 characters');
    }
    if (metaDescription !== undefined && metaDescription.length > 1000) {
        errors.push('Meta description cannot exceed 1000 characters');
    }
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }
    next();
};
exports.validateCMSPageUpdate = validateCMSPageUpdate;
