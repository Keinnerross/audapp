'use strict';

/**
 * auditor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::auditor.auditor');
