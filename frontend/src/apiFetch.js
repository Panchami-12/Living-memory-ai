export async function apiFetch(input, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestUrl = input;
  let requestBody = options.body;

  const isFamily = localStorage.getItem("account_type") === "family";

  if (isFamily) {
    const ownerUserId = localStorage.getItem("user_id");
    const familyProfileId = localStorage.getItem("family_profile_id");

    const url = new URL(
      typeof input === "string" ? input : input.toString(),
      window.location.origin,
    );

    const isMemoryRequest =
      url.pathname === "/memories" || url.pathname.startsWith("/memories/");

    if (isMemoryRequest) {
      if (!ownerUserId || !familyProfileId) {
        throw new Error(
          "Family session information is missing. Please log in again.",
        );
      }

      // Use the authenticated owner's account and family profile.
      url.searchParams.set("user_id", ownerUserId);

      const method = (options.method || "GET").toUpperCase();

      if (method === "GET") {
        url.searchParams.set("viewer_profile_id", familyProfileId);
      }

      // AI Chat uses a JSON POST request.
      if (method === "POST" && url.pathname === "/memories/chat") {
        const contentType = headers.get("Content-Type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error("Invalid family chat request.");
        }

        let bodyData;

        try {
          bodyData = JSON.parse(requestBody || "{}");
        } catch {
          throw new Error("Invalid chat request data.");
        }

        requestBody = JSON.stringify({
          ...bodyData,
          user_id: Number(ownerUserId),
          viewer_profile_id: Number(familyProfileId),
        });
      }

      requestUrl = url.toString();
    }
  }

  return fetch(requestUrl, {
    ...options,
    body: requestBody,
    headers,
  });
}
