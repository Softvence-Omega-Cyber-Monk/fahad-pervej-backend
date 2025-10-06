import dotenv from "dotenv"
dotenv.config()


interface EnvConfig {
    PORT: string,
    DB_URL: string,
    NODE_ENV: "development" | "production"
}


export const enVars:EnvConfig = {
    PORT: process.env.PORT as string,
    DB_URL: process.env.DB_URL as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production"
}
