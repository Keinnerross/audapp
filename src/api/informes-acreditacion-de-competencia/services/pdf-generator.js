'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

module.exports = {
  async generarPDF(datos) {
    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            h1 { color: #005077; }
            p { font-size: 14px; margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>${datos.base_informe?.nombre_informe}</h1>
          <p><strong>Auditor:</strong> ${datos.nombre_auditor}</p>
          <p><strong>Empresa:</strong> ${datos.base_informe?.empresa}</p>
          <p><strong>Requerimientos:</strong> ${datos.procedimiento_general?.requerimiento?.length ?? 0}</p>
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
    const fileName = `${nombre}-${Date.now()}.pdf`;
    const tmpPath = path.join(os.tmpdir(), fileName);

    fs.writeFileSync(tmpPath, buffer);

    const form = new FormData();
    form.append('files', fs.createReadStream(tmpPath), {
      filename: fileName,
      contentType: 'application/pdf',
    });

    const token = process.env.STRAPI_ADMIN_TOKEN;
    if (!token) throw new Error("Falta STRAPI_ADMIN_TOKEN en tu .env");

    const res = await fetch('http://localhost:1337/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    fs.unlinkSync(tmpPath);

    const json = await res.json();
    if (!res.ok) {
      console.error("❌ Upload fallido:", json);
      throw new Error("Falló el upload por fetch interno.");
    }

    return json?.[0] || null;
  },
};
