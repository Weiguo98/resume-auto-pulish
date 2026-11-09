const isProduction = process.env.NODE_ENV === "production";

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  baseUrl: process.env.BASE_URL ?? (isProduction ? "http://localhost:3000" : "http://localhost:5173"),
  mockAi: Boolean(process.env.MOCK_AI),
  chromePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  databaseUrl: process.env.DATABASE_URL ?? "postgres://folio:folio@localhost:5434/folio",
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  },
};
