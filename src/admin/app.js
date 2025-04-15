const config = {
  locales: ["es", "en"],

  tutorials: false,
  notifications: { releases: false },

  translations: {
    es: {
      "Auth.form.email.label": "Correo electrónico",
      "Auth.form.password.label": "Contraseña",
      "Auth.form.button.login": "Entrar a Strapi",
      "Auth.form.welcome.title": "Bienvenido de vuelta",
      "app.components.HomePage.welcome": "Hola auditor",
      "app.components.HomePage.welcome.again": "Hola de nuevo",
      "app.components.HomePage.welcomeBlock.content": "Aquí puedes administrar los informes.",
      "app.components.HomePage.welcomeBlock.content.again": "¿Listo para seguir auditando?"
    },
    en: {
      "Auth.form.email.label": "Email",
      "Auth.form.password.label": "Password",
      "Auth.form.button.login": "Log into Strapi",
      "Auth.form.welcome.title": "Welcome back",
      "app.components.HomePage.welcome": "Hello auditor",
      "app.components.HomePage.welcome.again": "Welcome again",
      "app.components.HomePage.welcomeBlock.content": "Here you can manage your reports.",
      "app.components.HomePage.welcomeBlock.content.again": "Ready to keep auditing?"
    }
  }
};

const bootstrap = (app) => {
  console.log("🛠️ Bootstrap admin iniciado", app);
};

export default {
  config,
  bootstrap
};
