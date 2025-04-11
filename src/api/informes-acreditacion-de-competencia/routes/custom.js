module.exports = {
  routes: [
    {
      method: "POST",
      path: "/informes-acreditacion-de-competencias/generar-pdf",
      handler: "informes-acreditacion-de-competencia.generarPDF",
      config: {
        auth: false, // o true si usas tokens
      },
    },
    {
      method: "GET",
      path: "/informes-acreditacion-de-competencias/preview",
      handler: "informes-acreditacion-de-competencia.preview",
      config: {
        auth: false, // puedes poner true si quieres protegerlo
      },
    },
  ],
};
