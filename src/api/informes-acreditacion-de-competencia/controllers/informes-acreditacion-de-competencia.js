'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const ejs = require('ejs');
const path = require('path');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function generarCodigoUnico(strapi, fecha) {
  const fechaISO = new Date(fecha).toISOString().split('T')[0];
  const [año, mes, dia] = fechaISO.split('-');
  let correlativo = 1;

  let codigo;
  let existe = true;

  while (existe) {
    codigo = `ALCS-${año}D-${mes}${dia}-${String(correlativo).padStart(2, '2')}`;

    const existentes = await strapi.entityService.findMany('api::informe.informe', {
      filters: { codigo_informe: { $eq: codigo } },
      fields: ['id'],
      limit: 1,
    });

    if (existentes.length === 0) {
      existe = false;
    } else {
      correlativo++;
    }
  }

  return codigo;
}


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

        // 1. Generar código
        const fechaInforme = datos.base_informe.fecha_informe || new Date().toISOString();
        const codigoGenerado = await generarCodigoUnico(strapi, fechaInforme);


        // 2. Clonar los datos para el PDF
        const datosParaPDF = deepClone(datos);
        datosParaPDF.base_informe.codigo_informe = codigoGenerado;




        // 3. Agregar nombres de auditores
        if (Array.isArray(datos.base_informe.auditor) && datos.base_informe.auditor.length) {
          const auditores = await strapi.entityService.findMany('api::auditor.auditor', {
            filters: { documentId: { $in: datos.base_informe.auditor } },
            fields: ['Nombre'],
          });
          datosParaPDF.base_informe.auditor_nombres = auditores.map(a => a.Nombre).join(', ');
        } else {
          datosParaPDF.base_informe.auditor_nombres = '—';
        }

        // 4. Agregar nombre de empresa
        if (datos.base_informe.empresa) {
          const empresa = await strapi.entityService.findMany('api::empresa.empresa', {
            filters: { documentId: { $eq: datos.base_informe.empresa } },
            fields: ['Nombre'],
          });
          datosParaPDF.base_informe.empresa_nombre = empresa?.[0]?.Nombre || '—';
        } else {
          datosParaPDF.base_informe.empresa_nombre = '—';
        }




        console.log(datosParaPDF)

        // 5. Generar PDF
        const buffer = await strapi
          .service('api::informes-acreditacion-de-competencia.pdf-generator')
          .generarPDF(datosParaPDF);

        // 6. Subir PDF
        const archivoSubido = await strapi
          .service('api::informes-acreditacion-de-competencia.pdf-generator')
          .subirPDF(buffer, datos.base_informe.nombre_informe);

        if (!archivoSubido?.id) {
          throw new Error("Falló la subida del PDF al media library.");
        }

        // 7. Crear informe en base de datos
        const nuevoInforme = await strapi.entityService.create('api::informe.informe', {
          data: {
            nombre: datos.base_informe.nombre_informe,
            fecha: new Date().toISOString().split('T')[0],
            categoria: 'acreditacion de competencias',
            PDF: [archivoSubido.id],
            codigo_informe: codigoGenerado,
          },
        });

        // 8. Relacionar informe al componente
        const updatedEntry = await strapi.entityService.update(
          'api::informes-acreditacion-de-competencia.informes-acreditacion-de-competencia',
          idAcreditacion,
          {
            data: {
              'base_informe.informe': nuevoInforme.documentId,
            },
          }
        );

        // 9. Retornar respuesta
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

    async preview(ctx) {
      try {
        const templatePath = path.join(__dirname, '../../../templates/informes/acreditacion_competencias/informe.ejs');

        const datos = {
          base_informe: {
            nombre_informe: 'Informe de Prueba',
            fecha_informe: '2025-04-11',
            empresa: 'Capybara Corp',
            codigo_informe: 'ALCS-2025D-0411-01',
            auditor_nombres: 'Ross Dev, Capy Inspector',
            empresa_nombre: 'Capybara Corp'
          },
          procedimiento_general: {
            requerimiento: [
              {
                nombre_requerimiento: 'Verificar extintores',
                calificacion: 'cumple',
                comentario: 'Todo correcto',
                recomendacion: 'Revisar mensual',
                archivos: [{ name: 'foto1.jpg' }]
              }
            ]
          }
        };

        const html = await ejs.renderFile(templatePath, { datos });

        ctx.set('Content-Type', 'text/html');
        ctx.body = html;

      } catch (err) {
        console.error("❌ Error en preview:", err);
        ctx.throw(500, "Error generando vista previa");
      }
    }

  })
);
