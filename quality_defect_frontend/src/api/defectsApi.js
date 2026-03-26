import { http, toApiError } from "./httpClient";

let mockDefects = [
  {
    id: "DF-1001",
    title: "Scratch on housing",
    severity: "major",
    status: "open",
    station: "Assembly Line 2",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    description: "Visible scratch on left side of housing after assembly.",
    images: []
  },
  {
    id: "DF-1002",
    title: "Loose connector",
    severity: "critical",
    status: "in_review",
    station: "Final Test",
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    description: "Connector intermittently disconnects during vibration test.",
    images: []
  }
];

// PUBLIC_INTERFACE
export async function listDefects() {
  /** Lists defects from backend; falls back to mock data if endpoint unavailable. */
  try {
    const res = await http.get("/defects");
    return res.data;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 404 || apiErr.status === 0) return mockDefects;
    throw apiErr;
  }
}

// PUBLIC_INTERFACE
export async function getDefect(defectId) {
  /** Gets a defect by id. */
  try {
    const res = await http.get(`/defects/${encodeURIComponent(defectId)}`);
    return res.data;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 404 || apiErr.status === 0) {
      const found = mockDefects.find((d) => d.id === defectId);
      if (!found) throw { status: 404, message: "Defect not found", raw: err };
      return found;
    }
    throw apiErr;
  }
}

// PUBLIC_INTERFACE
export async function createDefect(payload) {
  /** Creates a new defect. */
  try {
    const res = await http.post("/defects", payload);
    return res.data;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 404 || apiErr.status === 0) {
      const newDefect = {
        id: `DF-${1000 + mockDefects.length + 1}`,
        status: "open",
        createdAt: new Date().toISOString(),
        images: [],
        ...payload
      };
      mockDefects = [newDefect, ...mockDefects];
      return newDefect;
    }
    throw apiErr;
  }
}

// PUBLIC_INTERFACE
export async function uploadDefectImage(defectId, file) {
  /** Uploads an image; falls back to object URL storage in mock mode. */
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await http.post(`/defects/${encodeURIComponent(defectId)}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 404 || apiErr.status === 0) {
      const url = URL.createObjectURL(file);
      mockDefects = mockDefects.map((d) =>
        d.id === defectId ? { ...d, images: [...(d.images || []), { url, name: file.name }] } : d
      );
      return { url, name: file.name };
    }
    throw apiErr;
  }
}
