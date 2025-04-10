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
    ],
  };
  