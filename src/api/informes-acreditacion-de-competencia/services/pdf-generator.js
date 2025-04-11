// ================================
// 📁 backend/src/api/.../pdf-generator.js
// ================================

'use strict';

const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  async generarPDF(datos) {
    try {
      const templatePath = path.join(__dirname, '../../../templates/informes/acreditacion_competencias/informe.ejs');
      const html = await ejs.renderFile(templatePath, { datos });  //Envío de datos al template.

      console.log(datos)

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const buffer = await page.pdf({ format: 'A4', printBackground: true });

      await browser.close();
      return buffer;
    } catch (err) {
      console.error('❌ Error al generar PDF:', err);
      throw new Error('Error generando el PDF');
    }
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

