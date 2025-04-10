'use strict';

/**
 * empresa service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::empresa.empresa');
