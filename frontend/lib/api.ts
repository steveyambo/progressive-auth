export type User = {
  id: number;
  name: string;
  email: string;
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
};

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

    throw new Error(message);
  }

  return data as TResponse;
}

export function register(input: RegisterInput) {
  return request<{ message: string; user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
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
    };
    stats: {
      authenticationLevel: string;
      isProtected: boolean;
    };
  }>("/api/dashboard");
}
