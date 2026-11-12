import { API_CONFIG } from './apiConfig';

export interface PlacePhotoResult {
  photo: string | null;
  totalPlaces: number;
  options: string[];
}

const API_BASE_URL = API_CONFIG.apiBase;

async function requestPlacePhoto(destination: string): Promise<PlacePhotoResult> {
  const normalizedDestination = String(destination || "").trim();

  if (!normalizedDestination) {
    return { photo: null, totalPlaces: 0, options: [] };
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/place-photo?place=${encodeURIComponent(normalizedDestination)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    throw new Error("Não foi possível conectar ao backend para buscar a foto do destino.");
  }

  const text = await response.text();
  let body: PlacePhotoResult = { photo: null, totalPlaces: 0, options: [] };

  if (text) {
    try {
      body = JSON.parse(text) as PlacePhotoResult;
    } catch {
      body = { photo: null, totalPlaces: 0, options: [] };
    }
  }

  if (!response.ok) {
    throw new Error(body?.error || "Erro ao buscar foto do destino.");
  }

  return body;
}

export async function buscarFotoDestino(destination: string): Promise<string | null> {
  const body = await requestPlacePhoto(destination);
  return body.photo ?? null;
}

export async function buscarOpcoesDestino(destination: string): Promise<{ totalPlaces: number; options: DestinationPlaceOption[] }> {
  const body = await requestPlacePhoto(destination);
  const options = Array.isArray(body.options) ? body.options : [];
  const totalPlaces = typeof body.totalPlaces === "number" ? body.totalPlaces : options.length;

  return {
    totalPlaces,
    options,
  };
}