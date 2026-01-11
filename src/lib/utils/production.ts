export const isProduction = (): boolean => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  ) {
    return true;
  }
  return false;
};

export const getUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  }

  if (isProduction()) {
    const vercelUrl =
      process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
    if (vercelUrl && vercelUrl.trim() !== "") {
      return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }
  }

  return "http://localhost:3000";
};
