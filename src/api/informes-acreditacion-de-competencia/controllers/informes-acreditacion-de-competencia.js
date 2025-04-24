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




//Funcion para formatear las fecha de 2025-04-11 a 11 de Abril de 2025
function formatDateLargo(date) {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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



        console.log("Datos para PDF: AJA", datosParaPDF);


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


        //4.1 Agregar nombre de operador para las acreditaciones

        if (Array.isArray(datos.acreditacion_competencias) && datos.acreditacion_competencias.length) {
          // Filtramos los IDs de los operadores
          // y eliminamos los valores falsy (null, undefined, etc.)
          const operadorIds = datos.acreditacion_competencias.map(item => item.operador).filter(Boolean);

          // Obtenemos los nombres de los operadores
          const operadores = await strapi.entityService.findMany('api::operador.operador', {
            filters: { documentId: { $in: operadorIds } },
            fields: ['Nombre'],
          });


          // Creamos un mapa de IDs a nombres de operadores es genial esta funcion pq nos devuelve un array con los objetos usando sus idsDocuments como clave
          const operadorMap = Object.fromEntries(operadores.map(op => [op.documentId, op.Nombre]));

          // Agregamos los nombres directamente a cada item de acreditacion_competencias
          datosParaPDF.acreditacion_competencias = datos.acreditacion_competencias.map(item => ({
            ...item,
            operador_nombre: operadorMap[item.operador] || '—',
          }));
        } else {
          datosParaPDF.acreditacion_competencias = [];
        }




        // 4.2 Agregar nombre de habitos

        // 6. Agregar nombres de operadores a hábitos operacionales
        if (Array.isArray(datos.habitos_operacionales) && datos.habitos_operacionales.length) {
          const operadorIdsHabitos = datos.habitos_operacionales
            .map(item => item.operador)
            .filter(Boolean);

          const operadoresHabitos = await strapi.entityService.findMany('api::operador.operador', {
            filters: { documentId: { $in: operadorIdsHabitos } },
            fields: ['Nombre'],
          });

          const operadorMapHabitos = Object.fromEntries(
            operadoresHabitos.map(op => [op.documentId, op.Nombre])
          );

          datosParaPDF.habitos_operacionales = datos.habitos_operacionales.map(item => ({
            ...item,
            operador_nombre: operadorMapHabitos[item.operador] || '—',
          }));
        } else {
          datosParaPDF.habitos_operacionales = [];
        }




        // 4.3 Formatear Fechas.


        // Base del informe
        datosParaPDF.base_informe.fecha_informe_formateada = formatDateLargo(datos.base_informe.fecha_informe);

        // Acreditaciones
        if (Array.isArray(datosParaPDF.acreditacion_competencias)) {
          datosParaPDF.acreditacion_competencias = datosParaPDF.acreditacion_competencias.map(item => ({
            ...item,
            fecha_evaluacion_formateada: formatDateLargo(item.fecha_evaluacion),
            fecha_evaluacion_teorica_formateada: formatDateLargo(item.fecha_evaluacion_teorica),
            fecha_evaluacion_practica_formateada: formatDateLargo(item.fecha_evaluacion_practica),
          }));
        }

        // Hábitos operacionales
        if (Array.isArray(datosParaPDF.habitos_operacionales)) {
          datosParaPDF.habitos_operacionales = datosParaPDF.habitos_operacionales.map(item => ({
            ...item,
            fecha_acreditacion_formateada: formatDateLargo(item.fecha_acreditacion),
            fecha_vigencia_licencia_interna_formateada: formatDateLargo(item.fecha_vigencia_licencia_interna),
          }));
        }


        //so, esto estas son las nuevas claves que se generan usando la funcion del formateo de fechas:

        // 🔑 Claves formateadas que estarán disponibles en el EJS:

        // Base del informe
        // base_informe.fecha_informe_formateada

        // Acreditación de competencias (por cada operador)
        // acreditacion_competencias[].fecha_evaluacion_formateada
        // acreditacion_competencias[].fecha_evaluacion_teorica_formateada
        // acreditacion_competencias[].fecha_evaluacion_practica_formateada

        // Hábitos operacionales (por cada operador)
        // habitos_operacionales[].fecha_acreditacion_formateada
        // habitos_operacionales[].fecha_vigencia_licencia_interna_formateada

        // 4.4 Reemplazar IDs de archivos y media por URLs absolutas de Strapi

        const baseURL = strapi.config.get('server.url') || 'http://localhost:1337';

        // Acreditaciones – scan_documento
        if (Array.isArray(datosParaPDF.acreditacion_competencias)) {
          for (const item of datosParaPDF.acreditacion_competencias) {
            if (Array.isArray(item.scan_documento) && item.scan_documento.length > 0) {
              const archivos = await strapi.entityService.findMany('plugin::upload.file', {
                filters: { id: { $in: item.scan_documento } },
                fields: ['url'],
              });
              item.scan_documento_urls = archivos.map(file => `${baseURL}${file.url}`);
            } else {
              item.scan_documento_urls = [];
            }
          }
        }

        // Procedimiento general, gestión de control, habilitación – requerimientos[].archivos
        const seccionesConRequerimientos = [
          'procedimiento_general',
          'gestion_de_control',
          'habilitacion'
        ];

        for (const seccion of seccionesConRequerimientos) {
          const datosSeccion = datosParaPDF[seccion];
          if (datosSeccion?.requerimiento?.length) {
            for (const req of datosSeccion.requerimiento) {
              if (Array.isArray(req.archivos) && req.archivos.length > 0) {
                const files = await strapi.entityService.findMany('plugin::upload.file', {
                  filters: { id: { $in: req.archivos } },
                  fields: ['url', 'name'],
                });
                req.archivos_urls = files.map(f => `${baseURL}${f.url}`);
              } else {
                req.archivos_urls = [];
              }
            }
          }
        }


        // 🔑 URLs listas para usar en el EJS:
        // acreditacion_competencias[].scan_documento_urls
        // procedimiento_general.requerimiento[].archivos_urls
        // gestion_de_control.requerimiento[].archivos_urls
        // habilitacion.requerimiento[].archivos_urls





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


        console.log("Nuevo informe creado:", nuevoInforme);


        // 8. Relacionar informe al componente

        const entry = await strapi.entityService.findOne(
          'api::informes-acreditacion-de-competencia.informes-acreditacion-de-competencia',
          idAcreditacion,
          { populate: ['base_informe'] }
        );

        const baseActual = entry.base_informe || {};

        const updatedEntry = await strapi.entityService.update(
          'api::informes-acreditacion-de-competencia.informes-acreditacion-de-competencia',
          idAcreditacion,
          {
            data: {
              base_informe: {
                ...baseActual, //Esto es necesario actualizarlo así pq si no actualizaría todo el componente.
                informe: nuevoInforme.documentId,
              }
            }
          }
        );

        console.log(updatedEntry)

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

        console.log("✅ Ruta del template:", templatePath);

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
          },
          acreditacion_competencias: [{
            __component: 'informe-acreditacion.acreditacion-competencias',
            operador: 'o162ags7edxvez31oo8yhj1z',
            rut_operador: '141510833',
            fecha_evaluacion: '2025-04-15T00:00:00.000Z',
            fecha_evaluacion_teorica: '2025-04-22T00:00:00.000Z',
            fecha_evaluacion_practica: '2025-04-22T00:00:00.000Z',
            evaluador: 'Camejo',
            rut_evaluador: '141510833',
            observaciones: 'Algunas observaciones',
            scan_documento: ['www.google.com', 'www.google.com',]
          },
          {
            __component: 'informe-acreditacion.acreditacion-competencias',
            operador: 'o162ags7edxvez31oo8yhj1z',
            rut_operador: '141510833',
            fecha_evaluacion: '2025-04-15T00:00:00.000Z',
            fecha_evaluacion_teorica: '2025-04-22T00:00:00.000Z',
            fecha_evaluacion_practica: '2025-04-22T00:00:00.000Z',
            evaluador: 'Camejo',
            rut_evaluador: '141510833',
            observaciones: 'Algunas observaciones',
            scan_documento: [Array]
          }
          ],
          gestion_de_control: {
            requerimiento: [], // 👈 al menos esto debe estar
          },
          habilitacion: {
            requerimiento: [], // 👈 también para evitar el mismo error
          },

          habitos_operacionales: [
            {
              __component: 'informe-acreditacion.habitos-operacionales',
              operador: 'w3ajfakl0tlzzn86t15ccqzi',
              rut_operador: '141510833',
              fecha_acreditacion: '2025-04-22T00:00:00.000Z',
              fecha_vigencia_licencia_interna: '2025-04-22T00:00:00.000Z',
              resultado: 'seguro',
              habitos_operacionales_realizados: 'si todo bien',
              situacion_actual: 'Disponible',
              conclusion_recomendacion: 'Ninguna'
            },
            {
              __component: 'informe-acreditacion.habitos-operacionales',
              operador: 'w3ajfakl0tlzzn86t15ccqzi',
              rut_operador: '141510833',
              fecha_acreditacion: '2025-04-22T00:00:00.000Z',
              fecha_vigencia_licencia_interna: '2025-04-22T00:00:00.000Z',
              resultado: 'seguro',
              habitos_operacionales_realizados: 'si todo bien',
              situacion_actual: 'Disponible',
              conclusion_recomendacion: 'Ninguna'
            }
          ],

          resumen_final: 'Resumen del informe de acreditación de competencias, descripción de los resultados obtenidos en la evaluación de competencias y hábitos operacionales del operador.',
        };


        const html = await ejs.renderFile(templatePath, { datos });

        ctx.set('Content-Type', 'text/html');
        ctx.body = html;

      } catch (err) {
        console.error("❌ Error en preview:", err);
        ctx.status = 500;
        ctx.body = { error: err.message };
      }
    }


  })
);
