import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { Express } from "express";

export const setupSwagger = (app: Express) => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Multivendor E-commerce API",
        version: "1.0.0",
        description: "Backend API for multivendor e-commerce system with customers and vendors",
      },
      servers: [
        {
          url: "http://localhost:5000/api/v1",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ["./src/app/modules/users/*.ts"], // route files with Swagger comments
  };

  const swaggerSpec = swaggerJSDoc(options);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📘 Swagger docs available at: http://localhost:5000/docs");
};
