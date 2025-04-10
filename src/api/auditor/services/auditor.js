'use strict';

/**
 * auditor service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::auditor.auditor');
