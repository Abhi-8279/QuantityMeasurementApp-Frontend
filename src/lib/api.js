const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

function looksLikeJwt(value) {
  return typeof value === "string" && value.split(".").length === 3;
}

function toQueryString(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      query.append(key, value);
    }
  });

  const builtQuery = query.toString();
  return builtQuery ? `?${builtQuery}` : "";
}

async function parseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text;
}

async function request(path, options = {}) {
  const { token, body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const parsedBody = await parseBody(response);

  if (!response.ok) {
    const message =
      typeof parsedBody === "string"
        ? parsedBody
        : parsedBody?.message || "Something went wrong while talking to the backend.";

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return parsedBody;
}

export async function registerUser(payload) {
  const response = await request("/users/register", {
    method: "POST",
    body: payload
  });

  if (typeof response === "string" && /already exists/i.test(response)) {
    throw new Error(response);
  }

  return response;
}

export async function loginUser(payload) {
  const response = await request("/users/login", {
    method: "POST",
    body: payload
  });

  if (!looksLikeJwt(response)) {
    throw new Error(response || "Login failed.");
  }

  return response;
}

export async function runMeasurementOperation(operation, payload, token) {
  const routeByOperation = {
    COMPARE: "/quantities/compare",
    CONVERT: "/quantities/convert",
    ADD: "/quantities/add",
    SUBTRACT: "/quantities/subtract",
    MULTIPLY: "/quantities/multiply",
    DIVIDE: "/quantities/divide"
  };

  return request(routeByOperation[operation], {
    method: "POST",
    body: payload,
    token
  });
}

export async function fetchMeasurements(filters, token) {
  return request(`/quantities/all${toQueryString(filters)}`, {
    method: "GET",
    token
  });
}

export async function fetchHistoryByOperation(operation, token) {
  return request(`/quantities/history/operation/${encodeURIComponent(operation)}`, {
    method: "GET",
    token
  });
}

export async function fetchOperationCount(operation, token) {
  return request(`/quantities/count/${encodeURIComponent(operation)}`, {
    method: "GET",
    token
  });
}

export async function fetchMeasurementById(id, token) {
  return request(`/quantities/${id}`, {
    method: "GET",
    token
  });
}

export async function deleteMeasurement(id, token) {
  return request(`/quantities/${id}`, {
    method: "DELETE",
    token
  });
}

export async function deleteAllMeasurements(token) {
  return request("/quantities/delete-all", {
    method: "DELETE",
    token
  });
}

export async function deleteFilteredMeasurements(filters, token) {
  return request(`/quantities/delete-filtered${toQueryString(filters)}`, {
    method: "DELETE",
    token
  });
}
