'use strict';

/**
 * informes-acreditacion-de-competencia controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const pdfService = require('../services/pdf-generator'); // Asegúrate que el path sea correcto

module.exports = createCoreController(
    'api::informes-acreditacion-de-competencia.informes-acreditacion-de-competencia',
    ({ strapi }) => ({
        async generarPDF(ctx) {
            try {
                const datos = ctx.request.body;

                if (!datos || !datos.base_informe?.nombre_informe) {
                    return ctx.badRequest("Faltan datos");
                }

                // 1. Generar el PDF
                const buffer = await pdfService.generarPDF(datos);

                // 2. Subir el PDF a la Media Library
                const archivo = await pdfService.subirPDF(buffer, datos.base_informe.nombre_informe);

                // 3. Devolver respuesta con info del archivo
                return ctx.send({
                    mensaje: "PDF generado y subido correctamente",
                    archivo,
                });

            } catch (error) {
                console.log("❌ Error al generar PDF:", error);
                ctx.throw(500, "Error generando el PDF");
            }
        },
    })
);
