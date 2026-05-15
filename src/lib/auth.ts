export const getSafeRedirectPath = (candidate: string | null) => {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/socios";
  }

  return candidate;
};