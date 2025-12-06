// Common API types and utilities
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.31.147:8040/api";

// Token refresh management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: ApiError | Error) => void;
}> = [];

const processQueue = (
  error: ApiError | Error | null,
  token: string | null = null
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Helper function to refresh token
async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const result = await response.json();
  const { access_token, refresh_token: newRefreshToken, user } = result.data;

  // Update stored tokens
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", newRefreshToken);
  localStorage.setItem("user_data", JSON.stringify(user));

  return access_token;
}

// Main API request function using fetch
export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const token = localStorage.getItem("access_token");

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body && { body }),
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    // Handle 401 - Token expired
    if (response.status === 401 && endpoint !== "/auth/refresh") {
      if (isRefreshing) {
        // Wait for token refresh
        const newToken = await new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });

        if (!newToken) {
          throw new ApiError(401, "Session expired. Please login again.");
        }

        // Retry with new token
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
      } else {
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);

          // Retry original request with new token
          fetchOptions.headers = {
            ...fetchOptions.headers,
            Authorization: `Bearer ${newToken}`,
          };
          response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_data");

          const err =
            refreshError instanceof Error
              ? refreshError
              : new Error("Token refresh failed");
          processQueue(err, null);

          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }

          throw new ApiError(401, "Session expired. Please login again.");
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = "Request failed";

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();

          // Extract error message from response
          if (typeof errorData === "string") {
            errorMessage = errorData;
          } else if (errorData.error && typeof errorData.error === "string") {
            errorMessage = errorData.error;
          } else if (
            errorData.message &&
            typeof errorData.message === "string"
          ) {
            errorMessage = errorData.message;
          } else if (errorData.errors) {
            if (Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.join(", ");
            } else if (typeof errorData.errors === "object") {
              const errorMessages = Object.values(errorData.errors)
                .flat()
                .filter((msg): msg is string => typeof msg === "string");
              errorMessage = errorMessages.join(", ");
            }
          }
        } else {
          errorMessage = await response.text();
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorMessage = `Request failed with status ${response.status}`;
      }

      throw new ApiError(response.status, errorMessage);
    }

    // Parse successful response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    // For non-JSON responses (like DELETE with no content)
    return {} as T;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      console.error("Network error:", error);
      throw new ApiError(
        0,
        "Network error: Unable to connect to the server. Please check your connection."
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in apiRequest:", error);
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}
