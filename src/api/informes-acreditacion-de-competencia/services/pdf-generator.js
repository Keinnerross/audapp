'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

function generarSeccion(nombre, data = {}) {
  if (!data?.requerimiento?.length) return '';
  return `
    <h2>${nombre}</h2>
    ${data.requerimiento
      .map(
        (req, idx) => `
        <div style="margin-bottom: 20px;">
          <h4>${idx + 1}) ${req.nombre_requerimiento}</h4>
          <p><strong>Calificación:</strong> ${req.calificacion}</p>
          <p><strong>Comentario:</strong> ${req.comentario}</p>
          <p><strong>Recomendación:</strong> ${req.recomendacion}</p>
          ${
            req.archivos?.length
              ? `<p><strong>Archivo:</strong> ${req.archivos[0].name || 'Imagen adjunta'}</p>`
              : ''
          }
        </div>`
      )
      .join('')}
    <hr/>
  `;
}

module.exports = {
  async generarPDF(datos) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            h1 { color: #005077; }
            p { font-size: 14px; }
            h2 { margin-top: 30px; color: #444; }
            hr { margin-top: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${datos.base_informe?.nombre_informe}</h1>
          <p><strong>Auditor:</strong> ${datos.nombre_auditor}</p>
          <p><strong>Empresa:</strong> ${datos.base_informe?.empresa}</p>

          ${generarSeccion('Procedimiento General', datos.procedimiento_general)}
          ${generarSeccion('Hábitos Operacionales', datos.habitos_operacionales)}
          ${generarSeccion('Gestión de Control', datos.gestion_de_control)}
          ${generarSeccion('Habilitación', datos.habilitacion)}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const buffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();
    return buffer;
  },

  async subirPDF(buffer, nombre = 'informe') {
    const token = process.env.STRAPI_ADMIN_TOKEN;
    if (!token) throw new Error('Falta STRAPI_ADMIN_TOKEN en tu .env');

    const fileName = `${nombre}-${Date.now()}.pdf`;
    const tmpDir = os.tmpdir();
    const tmpPath = path.join(tmpDir, fileName);

    fs.writeFileSync(tmpPath, buffer);

    const formData = new FormData();
    formData.append('files', fs.createReadStream(tmpPath), {
      filename: fileName,
      contentType: 'application/pdf',
    });

    try {
      const res = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      const uploaded = result?.[0];

      if (!uploaded || !uploaded.id) {
        throw new Error('Upload no retornó un archivo válido.');
      }

      console.log('✅ PDF subido:', uploaded);
      return uploaded;
    } catch (err) {
      console.error('❌ Error en el upload:', err);
      throw new Error('Falló la subida del PDF al media library.');
    } finally {
      fs.unlinkSync(tmpPath);
    }
  },
};
