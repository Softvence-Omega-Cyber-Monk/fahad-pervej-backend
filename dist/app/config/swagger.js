"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const setupSwagger = (app) => {
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
            tags: [
                {
                    name: "Users",
                    description: "User management endpoints",
                },
                {
                    name: "Products",
                    description: "Product management APIs (Admin & Vendor)",
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
        },
        apis: ["./src/app/modules/**/*.ts"],
        // route files with Swagger comments
    };
    const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
    app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
        swaggerOptions: {
            tagsSorter: 'none',
            operationsSorter: 'none',
        }
    }));
    console.log("📘 Swagger docs available at: http://localhost:5000/docs");
};
exports.setupSwagger = setupSwagger;
