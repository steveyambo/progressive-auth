export type User = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<TResponse>(
  url: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : "Request failed.";

    const code =
      data && typeof data === "object" && "code" in data
        ? String(data.code)
        : undefined;

    throw new ApiError(message, response.status, code);
  }

  return data as TResponse;
}

export function register(input: RegisterInput) {
  return request<{
    message: string;
    verificationEmailSent: boolean;
    user: User;
  }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(token: string) {
  return request<{
    message: string;
    emailVerified: boolean;
  }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerificationEmail(email: string) {
  return request<{ message: string }>(
    "/api/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export function login(input: LoginInput) {
  return request<{ message: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return request<{ user: User }>("/api/auth/me");
}

export function getDashboard() {
  return request<{
    message: string;
    user: {
      name: string;
      email: string;
      role: "USER" | "ADMIN";
      emailVerified: boolean;
    };
    stats: {
      authenticationLevel: string;
      isProtected: boolean;
    };
  }>("/api/dashboard");
}
