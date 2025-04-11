'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::informes-acreditacion-de-competencia.informes-acreditacion-de-competencia',
  ({ strapi }) => ({
    async generarPDF(ctx) {
      try {
        const datos = ctx.request.body;
        const idAcreditacion = datos.id_acreditacion;

        if (!datos || !datos.base_informe?.nombre_informe || !idAcreditacion) {
          return ctx.badRequest("Faltan datos obligatorios o ID de acreditación.");
        }

        // 1. Generar el PDF
        const buffer = await strapi
          .service('api::informes-acreditacion-de-competencia.pdf-generator')
          .generarPDF(datos);

        // 2. Subir el PDF al media library
        const archivoSubido = await strapi
          .service('api::informes-acreditacion-de-competencia.pdf-generator')
          .subirPDF(buffer, datos.base_informe.nombre_informe);

        if (!archivoSubido || !archivoSubido.id) {
          throw new Error("Falló la subida del PDF al media library.");
        }

        console.log("✅ Archivo subido con ID:", archivoSubido.id);

        // 3. Crear nueva entrada en 'informes'
        const nuevoInforme = await strapi.entityService.create('api::informe.informe', {
          data: {
            nombre: datos.base_informe.nombre_informe,
            fecha: new Date().toISOString().split('T')[0],
            categoria: 'acreditacion de competencias',
            PDF: [archivoSubido.id],
          },
        });

        console.log("✅ Informe creado con ID:", nuevoInforme);

        // 4. Relacionar el informe al componente base_informe
        const updatedEntry = await strapi.entityService.update(
          'api::informes-acreditacion-de-competencia.informes-acreditacion-de-competencia',
          idAcreditacion,
          {
            data: {
              base_informe: {
                ...datos.base_informe,
                informe: nuevoInforme.documentId,
              },
            },
          }
        );

        // 5. Retornar todo al frontend
        return ctx.send({
          mensaje: "✅ PDF generado, subido y relacionado con la acreditación.",
          informe: nuevoInforme,
          archivo: archivoSubido,
          url: archivoSubido?.url || null,
          actualizado: updatedEntry,
        });

      } catch (error) {
        console.error("❌ Error al generar PDF:", error);
        ctx.throw(500, "Error generando el PDF");
      }
    },
  })
);
