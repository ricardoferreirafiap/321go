import type { Orcamento } from "./orcamentosApi";
import type { Funcionario } from "./funcionariosApi";

const DATABASE_NAME = "portal-web-cache";
const DATABASE_VERSION = 4;
const ROTEIROS_STORE_NAME = "roteiros";
const FUNCIONARIOS_STORE_NAME = "funcionarios";
const FUNCIONARIOS_KEY = "lista";
const CAMPOS_DE_ANEXO = new Set([
  "documentos",
  "voucher",
  "voucherTipo",
  "voucherNome",
  "documento",
  "arquivo",
  "base64",
]);
export const ROTEIRO_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export interface RoteiroCacheEntry {
  key: string;
  savedAt: number;
  complete: boolean;
  value: Orcamento;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (event.oldVersion < 4 && database.objectStoreNames.contains(ROTEIROS_STORE_NAME)) {
        database.deleteObjectStore(ROTEIROS_STORE_NAME);
      }
      if (!database.objectStoreNames.contains(ROTEIROS_STORE_NAME)) {
        database.createObjectStore(ROTEIROS_STORE_NAME, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(FUNCIONARIOS_STORE_NAME)) {
        database.createObjectStore(FUNCIONARIOS_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("O cache offline está bloqueado por outra aba aberta."));
  });
}

export function prepararRoteiroSemAnexos(orcamento: Orcamento): Orcamento {
  return JSON.parse(
    JSON.stringify(orcamento, (key, value) => (CAMPOS_DE_ANEXO.has(key) ? undefined : value)),
  ) as Orcamento;
}

function criarCopiaPersistivel(orcamento: Orcamento): Orcamento {
  return JSON.parse(JSON.stringify(orcamento)) as Orcamento;
}

export async function obterRoteiroDoCache(identificador: string): Promise<RoteiroCacheEntry | null> {
  if (!identificador || typeof indexedDB === "undefined") {
    return null;
  }

  try {
    const database = await openDatabase();
    const entry = await new Promise<RoteiroCacheEntry | undefined>((resolve, reject) => {
      const transaction = database.transaction(ROTEIROS_STORE_NAME, "readonly");
      const request = transaction.objectStore(ROTEIROS_STORE_NAME).get(identificador);
      request.onsuccess = () => resolve(request.result as RoteiroCacheEntry | undefined);
      request.onerror = () => reject(request.error);
    });
    database.close();

    return entry ? { ...entry, savedAt: entry.savedAt || 0 } : null;
  } catch {
    return null;
  }
}

export async function salvarRoteiroNoCache(
  orcamento: Orcamento,
  complete = true,
): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const keys = [String(orcamento.numero || ""), String(orcamento.publicToken || "")].filter(Boolean);
  if (keys.length === 0) {
    return;
  }

  try {
    const value = criarCopiaPersistivel(orcamento);
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(ROTEIROS_STORE_NAME, "readwrite");
      const store = transaction.objectStore(ROTEIROS_STORE_NAME);
      const savedAt = Date.now();

      for (const key of keys) {
        store.put({ key, savedAt, complete, value } satisfies RoteiroCacheEntry);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch (error) {
    console.warn("Não foi possível salvar o roteiro para acesso offline.", error);
  }
}

export async function obterFuncionariosDoCache(): Promise<Funcionario[]> {
  if (typeof indexedDB === "undefined") {
    return [];
  }

  try {
    const database = await openDatabase();
    const funcionarios = await new Promise<Funcionario[] | undefined>((resolve, reject) => {
      const transaction = database.transaction(FUNCIONARIOS_STORE_NAME, "readonly");
      const request = transaction.objectStore(FUNCIONARIOS_STORE_NAME).get(FUNCIONARIOS_KEY);
      request.onsuccess = () => resolve(request.result as Funcionario[] | undefined);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return Array.isArray(funcionarios) ? funcionarios : [];
  } catch {
    return [];
  }
}

export async function salvarFuncionariosNoCache(funcionarios: Funcionario[]): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(FUNCIONARIOS_STORE_NAME, "readwrite");
      transaction.objectStore(FUNCIONARIOS_STORE_NAME).put(funcionarios, FUNCIONARIOS_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // The itinerary remains usable without optional employee details.
  }
}

export async function removerRoteiroDoCache(identificador: string): Promise<void> {
  if (!identificador || typeof indexedDB === "undefined") {
    return;
  }

  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(ROTEIROS_STORE_NAME, "readwrite");
      transaction.objectStore(ROTEIROS_STORE_NAME).delete(identificador);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // Missing browser storage does not prevent server-side deletion.
  }
}
