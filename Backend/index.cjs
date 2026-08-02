const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) continue;

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex <= 0) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}
loadEnvFile(path.resolve(__dirname, '.env'));
const express = require('express');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const GroqService = require('./groq/index.cjs');
const GeminiService = require('./gemini/index.cjs');
const OpenAIService = require('./openai/index.cjs');
const OpenRouterService = require('./openrouter/index.cjs');
const CloudflareService = require('./cloudflare/index.cjs');

// AIService roteia para o provedor correto
const AIService = {
    async generate(messages, provedor) {
        const provider = provedor || process.env.AI_PROVIDER || 'openai';
        
        switch (provider) {
            case 'openai':
                return OpenAIService.generate(messages);
            case 'groq':
                return GroqService.generate(messages);
            case 'gemini':
                return GeminiService.generate(messages);
            case 'openrouter':
                return OpenRouterService.generate(messages);
            case 'cloudflare':
                return CloudflareService.generate(messages);
            default:
                return OpenAIService.generate(messages);
        }
    }
};

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex <= 0) {
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

loadEnvFile(path.resolve(__dirname, './.env'));
loadEnvFile(path.resolve(__dirname, './.env.local'));

const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || FRONTEND_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const LOCALHOST_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const WHATSAPP_AUTH_PATH =
    process.env.WHATSAPP_AUTH_PATH ||
    path.resolve(process.env.LOCALAPPDATA || process.env.TEMP || process.cwd(), 'PortalWeb', 'wwebjs_auth');
const WHATSAPP_CACHE_PATH =
    process.env.WHATSAPP_CACHE_PATH ||
    path.resolve(process.env.LOCALAPPDATA || process.env.TEMP || process.cwd(), 'PortalWeb', 'wwebjs_cache');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.json());

function normalizeOrigin(origin) {
    return String(origin || '').trim().replace(/\/$/, '').toLowerCase();
}

function isAllowedOrigin(origin) {
    if (typeof origin !== 'string') {
        return false;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (LOCALHOST_ORIGIN_REGEX.test(normalizedOrigin)) {
        return true;
    }

    return FRONTEND_ORIGINS.some((allowedOrigin) => {
        const normalizedAllowed = normalizeOrigin(allowedOrigin);

        if (!normalizedAllowed) {
            return false;
        }

        if (normalizedAllowed.includes('*')) {
            const regexPattern = normalizedAllowed
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\*/g, '.*');
            const wildcardRegex = new RegExp(`^${regexPattern}$`, 'i');
            return wildcardRegex.test(normalizedOrigin);
        }

        return normalizedAllowed === normalizedOrigin;
    });
}

function resolveConnectionString() {
    return (
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.NEON_DATABASE_URL ||
        ''
    );
}

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = isAllowedOrigin(origin);

    if (allowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
    }

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        return allowed ? res.sendStatus(204) : res.sendStatus(403);
    }

    next();
});

const connectionString = resolveConnectionString();

const pool = connectionString
    ? new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    })
    : null;

let ensureOrcamentosDestinoColumnPromise = null;
let ensureOrcamentosPassageirosColumnPromise = null;
let ensureOrcamentosPagamentoColumnsPromise = null;
let ensureOrcamentosPacotesColumnPromise = null;
let ensureOrcamentosPerfilViagemColumnPromise = null;
let ensureOrcamentosPromptPerfilIaColumnPromise = null;
let ensureOrcamentosPromptRoteiroIaColumnPromise = null;
let ensureOrcamentosPublicTokenColumnPromise = null;
let ensureOrcamentosPublicTokenBackfillPromise = null;
let ensureFuncionariosSaudacoesColumnPromise = null;

async function ensureOrcamentosDestinoColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosDestinoColumnPromise) {
        ensureOrcamentosDestinoColumnPromise = pool
            .query('ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS destino VARCHAR(255)')
            .catch((error) => {
                ensureOrcamentosDestinoColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosDestinoColumnPromise;
}

async function ensureOrcamentosPassageirosColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPassageirosColumnPromise) {
        ensureOrcamentosPassageirosColumnPromise = pool
            .query("ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS passageiros JSONB DEFAULT '[]'::jsonb")
            .catch((error) => {
                ensureOrcamentosPassageirosColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosPassageirosColumnPromise;
}

async function ensureOrcamentosPagamentoColumns() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPagamentoColumnsPromise) {
        ensureOrcamentosPagamentoColumnsPromise = Promise.all([
            pool.query("ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50)"),
            pool.query('ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS parcelas INTEGER'),
        ]).catch((error) => {
            ensureOrcamentosPagamentoColumnsPromise = null;
            throw error;
        });
    }

    await ensureOrcamentosPagamentoColumnsPromise;
}

async function ensureOrcamentosPacotesColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPacotesColumnPromise) {
        ensureOrcamentosPacotesColumnPromise = pool
            .query("ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS pacotes JSONB DEFAULT '[]'::jsonb")
            .catch((error) => {
                ensureOrcamentosPacotesColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosPacotesColumnPromise;
}

async function ensureOrcamentosPerfilViagemColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPerfilViagemColumnPromise) {
        ensureOrcamentosPerfilViagemColumnPromise = pool
            .query("ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS perfil_viagem JSONB DEFAULT '[]'::jsonb")
            .catch((error) => {
                ensureOrcamentosPerfilViagemColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosPerfilViagemColumnPromise;
}

async function ensureOrcamentosPromptPerfilIaColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPromptPerfilIaColumnPromise) {
        ensureOrcamentosPromptPerfilIaColumnPromise = pool
            .query('ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS prompt_perfil_ia TEXT')
            .catch((error) => {
                ensureOrcamentosPromptPerfilIaColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosPromptPerfilIaColumnPromise;
}

async function ensureOrcamentosPromptRoteiroIaColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPromptRoteiroIaColumnPromise) {
        ensureOrcamentosPromptRoteiroIaColumnPromise = pool
            .query('ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS prompt_roteiro_ia TEXT')
            .catch((error) => {
                ensureOrcamentosPromptRoteiroIaColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosPromptRoteiroIaColumnPromise;
}

async function ensureOrcamentosPublicTokenColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPublicTokenColumnPromise) {
        ensureOrcamentosPublicTokenColumnPromise = pool
            .query('ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS public_token VARCHAR(36)')
            .catch((error) => {
                ensureOrcamentosPublicTokenColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosPublicTokenColumnPromise;
}

async function backfillOrcamentosPublicToken() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosPublicTokenBackfillPromise) {
        ensureOrcamentosPublicTokenBackfillPromise = (async () => {
            await ensureOrcamentosPublicTokenColumn();

            const result = await pool.query(
                `SELECT id
                   FROM public.orcamentos
                  WHERE public_token IS NULL OR btrim(public_token) = ''`
            );

            for (const row of result.rows) {
                await pool.query(
                    `UPDATE public.orcamentos
                        SET public_token = $1,
                            atualizado_em = NOW()
                      WHERE id = $2
                        AND (public_token IS NULL OR btrim(public_token) = '')`,
                    [crypto.randomUUID(), row.id]
                );
            }
        })().catch((error) => {
            ensureOrcamentosPublicTokenBackfillPromise = null;
            throw error;
        });
    }

    await ensureOrcamentosPublicTokenBackfillPromise;
}

let ensureOrcamentosStatusViagemColumnPromise = null;
async function ensureOrcamentosStatusViagemColumn() {
    if (!pool) {
        return;
    }

    if (!ensureOrcamentosStatusViagemColumnPromise) {
        ensureOrcamentosStatusViagemColumnPromise = pool
            .query("ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS status_viagem VARCHAR(20) CHECK (status_viagem IN ('Não Iniciada', 'Em Andamento', 'Finalizada'))")
            .catch((error) => {
                ensureOrcamentosStatusViagemColumnPromise = null;
                throw error;
            });
    }

    await ensureOrcamentosStatusViagemColumnPromise;
}

async function ensureFuncionariosSaudacoesColumn() {
    if (!pool) {
        return;
    }

    if (!ensureFuncionariosSaudacoesColumnPromise) {
        ensureFuncionariosSaudacoesColumnPromise = pool
            .query('ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS saudacoes TEXT')
            .catch((error) => {
                ensureFuncionariosSaudacoesColumnPromise = null;
                throw error;
            });
    }

    await ensureFuncionariosSaudacoesColumnPromise;
}

function ensureDb(req, res, next) {
    if (!pool) {
        return res.status(500).json({
            error: 'String de conexão não configurada. Defina DATABASE_URL (ou POSTGRES_URL/POSTGRES_PRISMA_URL).',
        });
    }

    next();
}

function getInitials(name) {
    return String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function hashPassword(password) {
    if (!password) {
        return null;
    }

    return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, passwordHash) {
    if (!password || !passwordHash) {
        return false;
    }

    return hashPassword(password) === passwordHash;
}

function mapFuncionario(row) {
    return {
        id: Number(row.id),
        name: row.nome,
        role: row.cargo || '',
        department: row.departamento || '',
        status: row.status,
        initials: row.iniciais || getInitials(row.nome),
        accessLevel: row.nivel_acesso,
        email: row.email,
        saudacoes: row.saudacoes || '',
        photo: row.foto_url || undefined,
    };
}

function mapCliente(row) {
    return {
        id: Number(row.id),
        nome: row.nome,
        nomeCompleto: row.nome_completo || '',
        email: row.email || '',
        telefone: row.telefone || '',
        cep: row.cep || '',
        endereco: row.endereco || '',
        numero: row.numero || '',
        complemento: row.complemento || '',
        cidade: row.cidade || '',
        estado: row.estado || '',
        status: row.status,
        cpfCnpj: row.cpf_cnpj || '',
        rg: row.rg || '',
        dataNascimento: row.data_nascimento ? new Date(row.data_nascimento).toISOString().slice(0, 10) : '',
        documentoNome: row.documento_nome || '',
    };
}

function mapProduto(row) {
    return {
        id: Number(row.id),
        nome: row.nome,
        codigo: row.codigo || '',
        categoria: row.categoria || '',
        preco: Number(row.preco || 0),
        fornecedor: row.fornecedor || '',
        operadora: row.operadora || '',
        unidade: row.unidade || 'un',
        status: row.status,
    };
}

function mapFornecedor(row) {
    return {
        id: Number(row.id),
        razaoSocial: row.razao_social,
        nomeFantasia: row.nome_fantasia || '',
        cnpj: row.cnpj || '',
        email: row.email || '',
        telefone: row.telefone || '',
        cep: row.cep || '',
        endereco: row.endereco || '',
        complemento: row.complemento || '',
        cidade: row.cidade || '',
        estado: row.estado || '',
        status: row.status,
        categoria: row.categoria || '',
    };
}

function mapLead(row) {
    return {
        id: Number(row.id),
        nome: row.nome,
        email: row.email || '',
        whatsapp: row.whatsapp || '',
        status: row.status,
        statusCrm: row.status_crm,
        viagens: Number(row.viagens || 0),
        criadoEm: row.criado_em ? new Date(row.criado_em).toISOString().slice(0, 10) : '',
        atendente: row.atendente || '',
    };
}

function mapTarefa(row) {
    return {
        id: Number(row.id),
        titulo: row.titulo,
        descricao: row.descricao || '',
        responsavel: row.responsavel || '',
        prioridade: row.prioridade,
        status: row.status,
        prazo: row.prazo ? new Date(row.prazo).toISOString().slice(0, 10) : '',
        categoria: row.categoria || '',
    };
}

function mapEvento(row) {
    return {
        id: Number(row.id),
        titulo: row.titulo,
        descricao: row.descricao || '',
        data: row.data_evento ? new Date(row.data_evento).toISOString().slice(0, 10) : '',
        hora: row.hora || '',
        tipo: row.tipo,
        cliente: row.cliente || '',
        agente: row.agente || '',
    };
}

function mapOrcamento(row) {
    return {
        id: Number(row.id),
        numero: row.numero,
        publicToken: row.public_token || '',
        cliente: row.cliente,
        email: row.email || '',
        perfilViagem: Array.isArray(row.perfil_viagem) ? row.perfil_viagem : [],
        promptPerfilViagemIA: row.prompt_perfil_ia || '',
        promptRoteiroIA: row.prompt_roteiro_ia || '',
        passageiros: Array.isArray(row.passageiros) ? row.passageiros : [],
        formaPagamento: row.forma_pagamento || '',
        parcelas: row.parcelas ? Number(row.parcelas) : null,
        destino: row.destino || '',
        agenteViagem: row.agente_viagem || '',
        status: row.status,
        dataCriacao: row.data_criacao ? new Date(row.data_criacao).toISOString().slice(0, 10) : '',
        dataValidade: row.data_validade ? new Date(row.data_validade).toISOString().slice(0, 10) : '',
        observacoes: row.observacoes || '',
        itens: Array.isArray(row.itens) ? row.itens : [],
        pacotes: Array.isArray(row.pacotes) ? row.pacotes : [],
        voos: Array.isArray(row.voos) ? row.voos : [],
        hospedagem: Array.isArray(row.hospedagem) ? row.hospedagem : [],
        roteiro: row.roteiro || '',
        dayByDay: Array.isArray(row.day_by_day) ? row.day_by_day : [],
        transporte: Array.isArray(row.transporte) ? row.transporte : [],
        restaurante: Array.isArray(row.restaurante) ? row.restaurante : [],
        experiencias: Array.isArray(row.experiencias) ? row.experiencias : [],
        seguro: Array.isArray(row.seguro) ? row.seguro : [],
        statusViagem :  row.status_viagem || null,
    };
}

function mapLancamentoFinanceiro(row) {
    return {
        id: Number(row.id),
        tipo: row.tipo,
        descricao: row.descricao,
        valor: Number(row.valor || 0),
        data: row.data_lancamento ? new Date(row.data_lancamento).toISOString().slice(0, 10) : '',
        oculto: Boolean(row.oculto),
        orcamentoPago: Boolean(row.orcamento_pago),
        formaPagamento: row.forma_pagamento || '',
        parcelas: row.parcelas ? Number(row.parcelas) : null,
        orcamentoId: row.orcamento_id ? Number(row.orcamento_id) : null,
        orcamentoNumero: row.orcamento_numero || '',
        cliente: row.cliente || '',
        statusViagem: row.status_viagem || null,
    };
}

function normalizePayload(body) {
    return {
        name: String(body.name || '').trim(),
        role: String(body.role || '').trim(),
        department: String(body.department || '').trim(),
        status: body.status === 'Inativo' ? 'Inativo' : 'Ativo',
        accessLevel: body.accessLevel === 'Administrador' ? 'Administrador' : 'Agente',
        email: String(body.email || '').trim().toLowerCase(),
        saudacoes: String(body.saudacoes || '').trim(),
        password: typeof body.password === 'string' ? body.password : '',
        photo: typeof body.photo === 'string' ? body.photo : null,
    };
}

function normalizeClientePayload(body) {
    return {
        nome: String(body?.nome || '').trim(),
        nomeCompleto: String(body?.nomeCompleto || '').trim(),
        email: String(body?.email || '').trim().toLowerCase(),
        telefone: String(body?.telefone || '').trim(),
        cep: String(body?.cep || '').trim(),
        endereco: String(body?.endereco || '').trim(),
        numero: String(body?.numero || '').trim(),
        complemento: String(body?.complemento || '').trim(),
        cidade: String(body?.cidade || '').trim(),
        estado: String(body?.estado || '').trim().toUpperCase().slice(0, 2),
        status: body?.status === 'Inativo' ? 'Inativo' : 'Ativo',
        cpfCnpj: String(body?.cpfCnpj || '').trim(),
        rg: String(body?.rg || '').trim(),
        dataNascimento: String(body?.dataNascimento || '').trim(),
        documentoNome: String(body?.documentoNome || '').trim(),
    };
}

function normalizeProdutoPayload(body) {
    return {
        nome: String(body?.nome || '').trim(),
        codigo: String(body?.codigo || '').trim().toUpperCase(),
        categoria: String(body?.categoria || '').trim(),
        preco: Number(body?.preco || 0),
        fornecedor: String(body?.fornecedor || '').trim(),
        operadora: String(body?.operadora || '').trim(),
        unidade: String(body?.unidade || 'un').trim() || 'un',
        status: body?.status === 'Inativo' ? 'Inativo' : 'Ativo',
    };
}

function normalizeFornecedorPayload(body) {
    return {
        razaoSocial: String(body?.razaoSocial || '').trim(),
        nomeFantasia: String(body?.nomeFantasia || '').trim(),
        cnpj: String(body?.cnpj || '').trim(),
        email: String(body?.email || '').trim().toLowerCase(),
        telefone: String(body?.telefone || '').trim(),
        cep: String(body?.cep || '').trim(),
        endereco: String(body?.endereco || '').trim(),
        complemento: String(body?.complemento || '').trim(),
        cidade: String(body?.cidade || '').trim(),
        estado: String(body?.estado || '').trim().toUpperCase().slice(0, 2),
        status: body?.status === 'Inativo' ? 'Inativo' : 'Ativo',
        categoria: String(body?.categoria || '').trim(),
    };
}

function normalizeLeadPayload(body) {
    const status = body?.status;
    const statusCrm = body?.statusCrm;

    return {
        nome: String(body?.nome || '').trim(),
        email: String(body?.email || '').trim().toLowerCase(),
        whatsapp: String(body?.whatsapp || '').trim(),
        status: status === 'Em Contato' || status === 'Qualificado' || status === 'Perdido' || status === 'Vendido' ? status : 'Novo',
        statusCrm:
            statusCrm === 'Qualificação' ||
            statusCrm === 'Reunião' ||
            statusCrm === 'Follow-ups' ||
            statusCrm === 'Pagos' ||
            statusCrm === 'Nutrição' ||
            statusCrm === 'Finalizados'
                ? statusCrm
                : 'Novo Lead',
        viagens: Math.max(0, Number(body?.viagens || 0)),
        criadoEm: String(body?.criadoEm || '').trim(),
        atendente: String(body?.atendente || '').trim(),
    };
}

function normalizeTarefaPayload(body) {
    const status = body?.status;
    const prioridade = body?.prioridade;

    return {
        titulo: String(body?.titulo || '').trim(),
        descricao: String(body?.descricao || '').trim(),
        responsavel: String(body?.responsavel || '').trim(),
        prioridade: prioridade === 'Alta' || prioridade === 'Baixa' ? prioridade : 'Média',
        status: status === 'Em andamento' || status === 'Concluída' || status === 'Cancelada' ? status : 'Pendente',
        prazo: String(body?.prazo || '').trim(),
        categoria: String(body?.categoria || '').trim(),
    };
}

function normalizeEventoPayload(body) {
    const tipo = body?.tipo;

    return {
        titulo: String(body?.titulo || '').trim(),
        descricao: String(body?.descricao || '').trim(),
        data: String(body?.data || '').trim(),
        hora: String(body?.hora || '').trim(),
        tipo: tipo === 'Viagem' || tipo === 'Tarefa' || tipo === 'Lembrete' || tipo === 'Outro' ? tipo : 'Reunião',
        cliente: String(body?.cliente || '').trim(),
        agente: String(body?.agente || '').trim(),
    };
}

function normalizeOrcamentoPayload(body) {
    const status = body?.status;
    const parcelas = Number(body?.parcelas);
    const statusViagemRaw = String(body?.statusViagem || '').trim();
    const statusViagem =
    statusViagemRaw === 'Não Iniciada' ? 'Não Iniciada'
    : statusViagemRaw === 'Em Andamento' ? 'Em Andamento'
    : statusViagemRaw === 'Finalizada' ? 'Finalizada'
    : null;

    return {
        numero: String(body?.numero || '').trim(),
        cliente: String(body?.cliente || '').trim(),
        email: String(body?.email || '').trim().toLowerCase(),
        perfilViagem: Array.isArray(body?.perfilViagem)
            ? body.perfilViagem
                .map((item) => String(item || '').trim())
                .filter(Boolean)
            : [],
        promptPerfilViagemIA: String(body?.promptPerfilViagemIA || '').trim(),
        promptRoteiroIA: String(body?.promptRoteiroIA || '').trim(),
        passageiros: Array.isArray(body?.passageiros)
            ? body.passageiros
                .map((item) => String(item || '').trim())
                .filter(Boolean)
            : [],
        formaPagamento: String(body?.formaPagamento || '').trim(),
        parcelas: Number.isInteger(parcelas) && parcelas > 1 ? parcelas : null,
        destino: String(body?.destino || '').trim(),
        agenteViagem: String(body?.agenteViagem || '').trim(),
        status: status === 'Enviado' || status === 'Aprovado' || status === 'Rejeitado' || status === 'Cancelado' ? status : 'Rascunho',
        dataCriacao: String(body?.dataCriacao || '').trim(),
        dataValidade: String(body?.dataValidade || '').trim(),
        observacoes: String(body?.observacoes || '').trim(),
        itens: Array.isArray(body?.itens) ? body.itens : [],
        pacotes: Array.isArray(body?.pacotes) ? body.pacotes : [],
        voos: Array.isArray(body?.voos) ? body.voos : [],
        hospedagem: Array.isArray(body?.hospedagem) ? body.hospedagem : [],
        roteiro: typeof body?.roteiro === 'string' ? body.roteiro : '',
        dayByDay: Array.isArray(body?.dayByDay) ? body.dayByDay : [],
        transporte: Array.isArray(body?.transporte) ? body.transporte : [],
        restaurante: Array.isArray(body?.restaurante) ? body.restaurante : [],
        experiencias: Array.isArray(body?.experiencias) ? body.experiencias : [],
        seguro: Array.isArray(body?.seguro) ? body.seguro : [],
        statusViagem
    };
}

function normalizeLancamentoFinanceiroPayload(body) {
    const tipo = body?.tipo;
    const parsedOrcamentoId = Number(body?.orcamentoId);
    const orcamentoId = Number.isInteger(parsedOrcamentoId) && parsedOrcamentoId > 0 ? parsedOrcamentoId : null;
    const normalizedTipo = tipo === 'despesa' ? 'despesa' : 'receita';
    const orcamentoPago = body?.orcamentoPago === true;
    const formaPagamento = orcamentoPago ? String(body?.formaPagamento || '').trim() : '';
    const parcelas =
        orcamentoPago && Number.isInteger(Number(body?.parcelas)) && Number(body?.parcelas) > 0 ? Number(body?.parcelas) : null;

    return {
        tipo: normalizedTipo,
        descricao: String(body?.descricao || '').trim(),
        valor: Math.abs(Number(body?.valor || 0)),
        data: String(body?.data || '').trim(),
        oculto: body?.oculto === true,
        orcamentoPago,
        formaPagamento,
        parcelas,
        orcamentoId,
    };
}

function resolveDatabaseError(error) {
    if (!error) {
        return { status: 500, message: 'Erro de conexão com o banco de dados.' };
    }

    if (error.code === 'ENOTFOUND') {
        return { status: 503, message: 'Não foi possível resolver o host do banco (DNS). Verifique internet/VPN/DNS.' };
    }

    if (error.code === 'ECONNREFUSED') {
        return { status: 503, message: 'Conexão com o banco recusada. Verifique a string de conexão e firewall.' };
    }

    if (error.code === 'ETIMEDOUT') {
        return { status: 503, message: 'Tempo de conexão com o banco esgotado. Verifique rede e disponibilidade do Neon.' };
    }

    return { status: 500, message: 'Erro de conexão com o banco de dados.' };
}

const DEFAULT_OPENAI_SYSTEM_PROMPT =
    process.env.OPENAI_SYSTEM_PROMPT ||
    'Você é o Agente IA do PortalWeb. Responda em português do Brasil, com objetividade e foco em produtividade comercial.';

function mapOpenAiError(status, parsedBody) {
    const providerCode = String(parsedBody?.error?.code || '').toLowerCase();

    if (status === 401 || providerCode === 'invalid_api_key') {
        return {
            status: 502,
            code: 'OPENAI_INVALID_KEY',
            message: 'A chave da OpenAI está inválida ou expirada. Atualize GEMINI_API_KEY no backend.',
        };
    }

    if (status === 402 || providerCode === 'insufficient_quota') {
        return {
            status: 429,
            code: 'OPENAI_QUOTA_EXCEEDED',
            message: 'Seu limite de cota da OpenAI foi atingido. Verifique faturamento e créditos da conta.',
        };
    }

    if (status === 429 || providerCode === 'rate_limit_exceeded') {
        return {
            status: 429,
            code: 'OPENAI_RATE_LIMIT',
            message: 'Muitas solicitações em sequência. Aguarde alguns segundos e tente novamente.',
        };
    }

    if (providerCode === 'model_not_found') {
        return {
            status: 502,
            code: 'OPENAI_MODEL_NOT_FOUND',
            message: 'O modelo configurado em OPENAI_MODEL não foi encontrado para esta conta.',
        };
    }

    if (status >= 500) {
        return {
            status: 502,
            code: 'OPENAI_UNAVAILABLE',
            message: 'A OpenAI está indisponível no momento. Tente novamente em instantes.',
        };
    }

    return {
        status: 502,
        code: 'OPENAI_API_ERROR',
        message: parsedBody?.error?.message || 'Falha ao comunicar com a OpenAI.',
    };
}

function normalizeAiMessages(rawMessages) {
    if (!Array.isArray(rawMessages)) {
        return [];
    }

    const allowedRoles = new Set(['user', 'assistant']);

    return rawMessages
        .map((item) => ({
            role: typeof item?.role === 'string' ? item.role : '',
            content: typeof item?.content === 'string' ? item.content.trim() : '',
        }))
        .filter((item) => item.content && allowedRoles.has(item.role))
        .slice(-20);
}

function getGoogleMapsApiKey() {
    return String(process.env.GOOGLE_MAPS_API_KEY || '').trim();
}

function buildBackendBaseUrl(req) {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';
    return `${protocol}://${req.get('host')}`;
}

function normalizePlaceQuery(rawPlace) {
    return String(rawPlace || '').trim();
}

function normalizeTextForComparison(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ---------------------------------------------------------------------------
// GROQ AI fallback helpers — geram sugestões quando Google Places falha
// ---------------------------------------------------------------------------

async function generateAiFallbackOptions(place, tipo) {
    const prompts = {
        lodging: `Liste 5 opções de hospedagem (hotéis, pousadas ou resorts) em "${place}". Responda SOMENTE com um array JSON válido, sem texto extra. Formato de cada item: {"nome": "string", "local": "string", "endereco": "string", "classificacao": number (1-5), "totalAvaliacoes": number, "tiposQuarto": ["string"], "amenidades": ["string"], "precoBase": number, "linkOperadora": ""}`,
        restaurant: `Liste 5 opções de restaurantes em "${place}". Responda SOMENTE com um array JSON válido, sem texto extra. Formato de cada item: {"nome": "string", "local": "string", "endereco": "string", "classificacao": number (1-5), "totalAvaliacoes": number, "telefone": "", "website": "", "priceLevel": "$$"}`,
        experience: `Liste 5 experiências turísticas ou atrações em "${place}". Responda SOMENTE com um array JSON válido, sem texto extra. Formato de cada item: {"nome": "string", "local": "string", "endereco": "string", "classificacao": number (1-5), "totalAvaliacoes": number, "descricao": "string", "priceLevel": "$$"}`,
    };

    const provedores = ['groq', 'openai', 'gemini', 'openrouter', 'cloudflare'];
    let raw = null;

    for (const provedor of provedores) {
        try {
            raw = await AIService.generate([{ role: 'user', content: prompts[tipo] }], provedor);
            if (raw) break;
        } catch (_) {
            // tenta o próximo provedor
        }
    }

    if (!raw) return null;

    try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Google Places API — busca hospedagens, restaurantes e experiências
// ---------------------------------------------------------------------------

async function searchPlacesByType(textQuery, apiKey, includedTypes) {
    if (!textQuery || !apiKey) return [];

    try {
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            { textQuery, languageCode: 'pt-BR', pageSize: 10 },
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask':
                        'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours',
                },
            }
        );
        return Array.isArray(response?.data?.places) ? response.data.places : [];
    } catch (error) {
        logServerError('Erro ao buscar lugares por tipo:', error);
        return [];
    }
}

async function searchLodgingOptions(place) {
    const apiKey = getGoogleMapsApiKey();
    const candidates = buildPlaceSearchCandidates(place);

    for (const query of candidates) {
        const places = await searchPlacesByType(`hotéis pousadas ${query}`, apiKey, ['lodging']);
        if (places.length > 0) {
            return places.slice(0, 10).map((p, idx) => ({
                placeId: idx + 1,
                nome: String(p?.displayName?.text || query),
                local: String((p?.formattedAddress || query).split(',')[0] || query),
                endereco: String(p?.formattedAddress || query),
                classificacao: Number(p?.rating || 0),
                totalAvaliacoes: Number(p?.userRatingCount || 0),
                tiposQuarto: ['Standard', 'Superior', 'Suíte'],
                amenidades: ['Wi-Fi', 'Recepção 24h'],
                precoBase: 0,
                photos: null,
                linkOperadora: '',
            }));
        }
    }

    // Nenhum resultado no Google Places — tenta GROQ AI
    const aiOptions = await generateAiFallbackOptions(place, 'lodging');
    if (aiOptions && aiOptions.length > 0) {
        return aiOptions.map((item, idx) => ({
            placeId: idx + 1,
            nome: String(item?.nome || place),
            local: String(item?.local || place),
            endereco: String(item?.endereco || place),
            classificacao: Number(item?.classificacao || 4.0),
            totalAvaliacoes: Number(item?.totalAvaliacoes || 0),
            tiposQuarto: Array.isArray(item?.tiposQuarto) ? item.tiposQuarto : ['Standard'],
            amenidades: Array.isArray(item?.amenidades) ? item.amenidades : ['Wi-Fi'],
            precoBase: Number(item?.precoBase || 0),
            photos: null,
            linkOperadora: String(item?.linkOperadora || ''),
            fallback: 'ai-groq',
        }));
    }

    throw new Error('Sem resultados para hospedagem.');
}

async function searchRestaurantOptions(place) {
    const apiKey = getGoogleMapsApiKey();
    const candidates = buildPlaceSearchCandidates(place);

    for (const query of candidates) {
        const places = await searchPlacesByType(`restaurantes ${query}`, apiKey, ['restaurant']);
        if (places.length > 0) {
            return places.slice(0, 10).map((p, idx) => ({
                placeId: idx + 1,
                nome: String(p?.displayName?.text || query),
                local: String((p?.formattedAddress || query).split(',')[0] || query),
                endereco: String(p?.formattedAddress || query),
                classificacao: Number(p?.rating || 0),
                totalAvaliacoes: Number(p?.userRatingCount || 0),
                telefone: String(p?.internationalPhoneNumber || ''),
                website: String(p?.websiteUri || ''),
                priceLevel: p?.priceLevel ? String(p.priceLevel).replace('PRICE_LEVEL_', '') : '$$',
            }));
        }
    }

    // Nenhum resultado no Google Places — tenta GROQ AI
    const aiOptions = await generateAiFallbackOptions(place, 'restaurant');
    if (aiOptions && aiOptions.length > 0) {
        return aiOptions.map((item, idx) => ({
            placeId: idx + 1,
            nome: String(item?.nome || place),
            local: String(item?.local || place),
            endereco: String(item?.endereco || place),
            classificacao: Number(item?.classificacao || 4.0),
            totalAvaliacoes: Number(item?.totalAvaliacoes || 0),
            telefone: String(item?.telefone || ''),
            website: String(item?.website || ''),
            priceLevel: String(item?.priceLevel || '$$'),
            fallback: 'ai-groq',
        }));
    }

    throw new Error('Sem resultados para restaurantes.');
}

async function searchExperienceOptions(place) {
    const apiKey = getGoogleMapsApiKey();
    const candidates = buildPlaceSearchCandidates(place);

    for (const query of candidates) {
        const places = await searchPlacesByType(`atrações turísticas experiências ${query}`, apiKey, ['tourist_attraction', 'point_of_interest']);
        if (places.length > 0) {
            return places.slice(0, 10).map((p, idx) => ({
                placeId: idx + 1,
                nome: String(p?.displayName?.text || query),
                local: String((p?.formattedAddress || query).split(',')[0] || query),
                endereco: String(p?.formattedAddress || query),
                classificacao: Number(p?.rating || 0),
                totalAvaliacoes: Number(p?.userRatingCount || 0),
                descricao: '',
                priceLevel: p?.priceLevel ? String(p.priceLevel).replace('PRICE_LEVEL_', '') : '$$',
            }));
        }
    }

    // Nenhum resultado no Google Places — tenta GROQ AI (GROQ primeiro)
    const aiOptions = await generateAiFallbackOptions(place, 'experience');
    if (aiOptions && aiOptions.length > 0) {
        return aiOptions.map((item, idx) => ({
            placeId: idx + 1,
            nome: String(item?.nome || place),
            local: String(item?.local || place),
            endereco: String(item?.endereco || place),
            classificacao: Number(item?.classificacao || 4.5),
            totalAvaliacoes: Number(item?.totalAvaliacoes || 0),
            descricao: String(item?.descricao || ''),
            priceLevel: String(item?.priceLevel || '$$'),
            fallback: 'ai-groq',
        }));
    }

    throw new Error('Sem resultados para experiências.');
}

// ---------------------------------------------------------------------------

function buildQuotaFallbackLodgingOptions(place) {
    const normalizedPlace = normalizePlaceQuery(place)
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\b(brasil|brazil)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const city = (normalizedPlace.split(',')[0] || normalizedPlace || 'Destino').trim();

    const baseNames = [
        'Hotel Central',
        'Pousada Vista Mar',
        'Resort Premium',
        'Hotel Boutique',
        'Suítes Executivas',
    ];

    return baseNames.map((baseName, index) => ({
        placeId: index + 1,
        nome: `${baseName} ${city}`,
        local: city,
        endereco: `${city}, Brasil`,
        classificacao: 4.2,
        totalAvaliacoes: 120 + index * 35,
        tiposQuarto: ['Standard', 'Superior', 'Suíte'],
        amenidades: ['Wi-Fi', 'Café da manhã', 'Recepção 24h'],
        precoBase: 320 + index * 40,
        photos: null,
        linkOperadora: '',
        fallback: true,
    }));
}

function buildQuotaFallbackRestaurantOptions(place) {
    const normalizedPlace = normalizePlaceQuery(place)
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\b(brasil|brazil)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const city = (normalizedPlace.split(',')[0] || normalizedPlace || 'Destino').trim();

    const baseNames = [
        'Restaurante Sabor da Cidade',
        'Bistrô Panorama',
        'Cantina Bella Notte',
        'Casa Gourmet',
        'Cozinha Raízes',
    ];

    return baseNames.map((baseName, index) => ({
        placeId: index + 1,
        nome: `${baseName} ${city}`,
        local: city,
        endereco: `${city}, Brasil`,
        classificacao: 4.3,
        totalAvaliacoes: 140 + index * 28,
        telefone: '',
        website: '',
        priceLevel: '$$',
        fallback: true,
    }));
}

function buildQuotaFallbackExperienceOptions(place) {
    const normalizedPlace = normalizePlaceQuery(place)
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\b(brasil|brazil)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const city = (normalizedPlace.split(',')[0] || normalizedPlace || 'Destino').trim();

    const baseNames = [
        'City Tour Histórico',
        'Passeio Cultural Guiado',
        'Experiência Gastronômica Local',
        'Roteiro de Mirantes',
        'Passeio ao Pôr do Sol',
    ];

    return baseNames.map((baseName, index) => ({
        placeId: index + 1,
        nome: `${baseName} em ${city}`,
        local: city,
        endereco: `${city}, Brasil`,
        classificacao: 4.5,
        totalAvaliacoes: 90 + index * 22,
        descricao: `Sugestão de experiência em ${city}.`,
        priceLevel: '$$',
        fallback: true,
    }));
}

function buildPlaceSearchCandidates(place) {
    const original = normalizePlaceQuery(place);
    const withoutParentheses = original.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    const compact = withoutParentheses.replace(/\s*[\-–]\s*[A-Z]{3,6}\d*$/g, '').trim();

    const candidates = [];
    const pushCandidate = (value) => {
        const normalized = normalizePlaceQuery(value);
        if (!normalized) {
            return;
        }
        if (!candidates.includes(normalized)) {
            candidates.push(normalized);
        }
    };

    pushCandidate(original);
    pushCandidate(withoutParentheses);
    pushCandidate(compact);

    const bestBase = compact || withoutParentheses || original;
    if (bestBase && !/\b(brasil|brazil)\b/i.test(bestBase)) {
        pushCandidate(`${bestBase}, Brasil`);
    }

    return candidates;
}

function isAirportLike(place) {
    const text = normalizeTextForComparison(
        `${place?.displayName?.text || ''} ${place?.formattedAddress || ''}`
    );

    return /\bairport\b/.test(text) || /\baeroporto\b/.test(text);
}

function scorePlaceForPhoto(place, query) {
    const name = normalizeTextForComparison(place?.displayName?.text || '');
    const address = normalizeTextForComparison(place?.formattedAddress || '');
    const queryNorm = normalizeTextForComparison(query);
    const queryWords = queryNorm.split(/\s+/).filter(Boolean);
    const hasPhoto = Array.isArray(place?.photos) && place.photos.length > 0;
    const isAirport = isAirportLike(place);

    if (!hasPhoto) {
        return -1;
    }

    if (isAirport) {
        return -1;
    }

    let score = 0;

    if (name === queryNorm) {
        score += 100;
    } else if (name.includes(queryNorm)) {
        score += 50;
    } else {
        const nameWords = name.split(/\s+/).filter(Boolean);
        const matchCount = queryWords.filter((word) => nameWords.includes(word)).length;
        score += matchCount * 10;
    }

    if (address.includes(queryNorm)) {
        score += 20;
    }

    if (place?.rating) {
        score += place.rating * 2;
    }

    if (place?.userRatingCount) {
        score += Math.min(place.userRatingCount / 100, 10);
    }

    return score;
}

function scoreCenterCandidate(place, query) {
    const name = normalizeTextForComparison(place?.displayName?.text || '');
    const address = normalizeTextForComparison(place?.formattedAddress || '');
    const queryNorm = normalizeTextForComparison(query);
    const queryWords = queryNorm.split(/\s+/).filter(Boolean);
    const isAirport = isAirportLike(place);

    if (isAirport) {
        return -1;
    }

    let score = 0;

    if (name === queryNorm) {
        score += 100;
    } else if (name.includes(queryNorm)) {
        score += 50;
    } else {
        const nameWords = name.split(/\s+/).filter(Boolean);
        const matchCount = queryWords.filter((word) => nameWords.includes(word)).length;
        score += matchCount * 10;
    }

    if (address.includes(queryNorm)) {
        score += 20;
    }

    if (place?.rating) {
        score += place.rating * 2;
    }

    if (place?.userRatingCount) {
        score += Math.min(place.userRatingCount / 100, 10);
    }

    return score;
}

function logPlacePhoto(context, data) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[PlacePhoto ${timestamp}]`;
    console.log(`${prefix} ${context}`, JSON.stringify(data, null, 2));
}

function logServerError(context, error) {
    const timestamp = new Date().toISOString();
    const prefix = `[ServerError ${timestamp}]`;
    console.error(`${prefix} ${context}`, error?.message || error, error?.stack || '');
}

function parseAxiosError(error, fallbackMessage) {
    if (error?.response) {
        const status = Number(error.response.status) || 500;
        const data = error.response.data;

        if (data?.error?.message) {
            return { status, message: data.error.message };
        }

        if (typeof data?.error === 'string') {
            return { status, message: data.error };
        }

        if (status === 403) {
            return { status: 403, message: 'Acesso negado pela API externa. Verifique a chave de API e permissões.' };
        }

        if (status === 404) {
            return { status: 404, message: 'Recurso não encontrado na API externa.' };
        }

        if (status >= 500) {
            return { status: 502, message: 'API externa retornou erro interno.' };
        }

        return { status, message: `API externa retornou status ${status}.` };
    }

    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
        return { status: 503, message: 'API externa indisponível. Verifique internet/VPN.' };
    }

    return { status: 500, message: fallbackMessage || 'Erro desconhecido ao comunicar com API externa.' };
}

async function searchPlacesByText(textQuery, apiKey) {
    if (!textQuery || !apiKey) {
        return [];
    }

    try {
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            {
                textQuery,
                languageCode: 'pt-BR',
                pageSize: 10,
            },
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask':
                        'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types',
                },
            }
        );

        return Array.isArray(response?.data?.places) ? response.data.places : [];
    } catch (error) {
        logServerError('Erro ao buscar lugares por texto:', error);
        return [];
    }
}

async function searchNearbyPhotoPlace(center, apiKey) {
    if (!center || !apiKey) {
        return [];
    }

    try {
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:searchNearby',
            {
                locationRestriction: {
                    circle: {
                        center: {
                            latitude: center.latitude,
                            longitude: center.longitude,
                        },
                        radius: 500,
                    },
                },
                includedTypes: ['tourist_attraction', 'point_of_interest', 'natural_feature', 'park', 'landmark'],
                languageCode: 'pt-BR',
                maxResultCount: 10,
            },
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask':
                        'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types',
                },
            }
        );

        return Array.isArray(response?.data?.places) ? response.data.places : [];
    } catch (error) {
        logServerError('Erro ao buscar lugares próximos:', error);
        return [];
    }
}

async function hydratePlacesWithDetailsPhotos(places, apiKey) {
    if (!Array.isArray(places) || !apiKey) {
        return [];
    }

    const enriched = [];

    for (const place of places) {
        const name = place?.displayName?.text || '';
        const address = place?.formattedAddress || '';
        const hasPhoto = Array.isArray(place?.photos) && place.photos.length > 0;

        if (hasPhoto) {
            enriched.push(place);
            continue;
        }

        if (!name && !address) {
            continue;
        }

        try {
            const searchQuery = name || address;
            const response = await axios.post(
                'https://places.googleapis.com/v1/places:searchText',
                {
                    textQuery: searchQuery,
                    languageCode: 'pt-BR',
                    pageSize: 1,
                },
                {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask':
                            'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types',
                    },
                }
            );

            const hydrated = response?.data?.places?.[0];
            if (hydrated && Array.isArray(hydrated.photos) && hydrated.photos.length > 0) {
                enriched.push(hydrated);
            } else {
                enriched.push(place);
            }
        } catch (error) {
            enriched.push(place);
        }
    }

    return enriched;
}

async function fetchWikipediaThumbnail(place) {
    const candidates = buildPlaceSearchCandidates(place);

    for (const candidate of candidates) {
        const parts = candidate.split(',').map((part) => part.trim()).filter(Boolean);
        const title = parts[0];

        if (!title) {
            continue;
        }

        const locales = ['pt', 'en'];

        for (const locale of locales) {
            try {
                const response = await axios.get(`https://${locale}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'PortalWeb-PlacePhoto/1.0',
                    },
                });

                const thumbnail = response?.data?.thumbnail?.source;
                if (typeof thumbnail === 'string' && /^https?:\/\//i.test(thumbnail)) {
                    return {
                        url: thumbnail,
                        source: `wikipedia-${locale}`,
                        title,
                    };
                }
            } catch (_) {
                // Ignore and continue trying other title/locale combinations.
            }
        }
    }

    return null;
}

async function canUseStreetView(apiKey, latitude, longitude) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/streetview/metadata', {
            timeout: 10000,
            params: {
                location: `${latitude},${longitude}`,
                source: 'outdoor',
                key: apiKey,
            },
        });

        const status = String(response?.data?.status || '').toUpperCase();
        return {
            ok: status === 'OK',
            status,
        };
    } catch (error) {
        return {
            ok: false,
            status: Number(error?.response?.status || 0) ? `HTTP_${error.response.status}` : 'ERROR',
        };
    }
}

async function searchDestinationPhotoName(place) {
    const apiKey = getGoogleMapsApiKey();
    const candidates = buildPlaceSearchCandidates(place);
    let selected = null;
    let fallbackCenter = null;
    const optionsMap = new Map();

    const registerOptions = (places) => {
        if (!Array.isArray(places)) {
            return;
        }

        for (const item of places) {
            const name = String(item?.displayName?.text || '').trim();
            const address = String(item?.formattedAddress || '').trim();
            const key = normalizeTextForComparison(name || address);
            if (!key) {
                continue;
            }

            if (!optionsMap.has(key)) {
                optionsMap.set(key, {
                    name: name || address,
                    address: address || null,
                });
            }
        }
    };

    logPlacePhoto('TextSearch candidates', { place, candidates });

    for (const textQuery of candidates) {
        logPlacePhoto('TextSearch request', { place, textQuery });

        const placesRaw = await searchPlacesByText(textQuery, apiKey);
        registerOptions(placesRaw);
        const places = await hydratePlacesWithDetailsPhotos(placesRaw, apiKey);
        const centerCandidates = places
            .map((item) => ({
                item,
                score: scoreCenterCandidate(item, textQuery),
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => b.score - a.score);

        if (centerCandidates.length > 0) {
            const bestCenter = centerCandidates[0];
            if (!fallbackCenter || bestCenter.score > fallbackCenter.score) {
                fallbackCenter = {
                    latitude: bestCenter.item.location.latitude,
                    longitude: bestCenter.item.location.longitude,
                    sourceQuery: textQuery,
                    sourcePlace: bestCenter.item?.displayName?.text || null,
                    score: bestCenter.score,
                };
            }
        }
        const ranked = places
            .map((item) => ({
                item,
                score: scorePlaceForPhoto(item, textQuery),
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => b.score - a.score);

        logPlacePhoto('TextSearch response', {
            place,
            textQuery,
            totalPlaces: placesRaw.length,
            rankedWithPhoto: ranked.length,
            topMatches: places.slice(0, 3).map((item) => ({
                name: item?.displayName?.text || null,
                address: item?.formattedAddress || null,
                photoCount: Array.isArray(item?.photos) ? item.photos.length : 0,
                airportLike: isAirportLike(item),
            })),
        });

        if (ranked.length > 0) {
            selected = {
                textQuery,
                place: ranked[0].item,
                score: ranked[0].score,
                method: 'textSearch',
            };
            break;
        }
    }

    if (!selected && fallbackCenter) {
        logPlacePhoto('NearbySearch request', {
            place,
            center: {
                latitude: fallbackCenter.latitude,
                longitude: fallbackCenter.longitude,
            },
            sourceQuery: fallbackCenter.sourceQuery,
            sourcePlace: fallbackCenter.sourcePlace,
        });

        const nearbyPlacesRaw = await searchNearbyPhotoPlace(fallbackCenter, apiKey);
        registerOptions(nearbyPlacesRaw);
        const nearbyPlaces = await hydratePlacesWithDetailsPhotos(nearbyPlacesRaw, apiKey);
        const nearbyRanked = nearbyPlaces
            .map((item) => ({
                item,
                score: scorePlaceForPhoto(item, place),
            }))
        if (rawMessage) {
            if (status === 401 || status === 403) {
                return { status: 502, message: rawMessage };
            }
            if (status >= 400 && status < 500) {
                return { status: 502, message: rawMessage };
            }
        }
    }

    if (status === 401 || status === 403) {
        return { status: 502, message: 'Falha ao autenticar na Google Places API. Verifique GOOGLE_MAPS_API_KEY.' };
    }

    if (status === 429) {
        return { status: 429, message: 'Limite de requisições da Google Places API atingido. Tente novamente em instantes.' };
    }

    if (status >= 400 && status < 500) {
        return { status: 502, message: apiMessage || fallbackMessage };
    }

    if (error?.code === 'ECONNABORTED') {
        return { status: 504, message: 'Tempo de resposta da Google Places API excedido.' };
    }

    return { status: 502, message: fallbackMessage };
}

function buildStaticDestinationFallbackUrl(place) {
    const candidates = buildPlaceSearchCandidates(place);
    const preferred = candidates.find((item) => !/[()]/.test(item)) || candidates[0] || '';
    const normalized = normalizeTextForComparison(preferred || place || 'destino viagem brasil');
    const seed = encodeURIComponent(normalized.replace(/\s+/g, '-'));
    return {
        url: `https://picsum.photos/seed/${seed}/1600/900`,
        source: 'picsum-seeded',
    };
}

function buildWikipediaTitleCandidates(place) {
    const candidates = buildPlaceSearchCandidates(place)
        .map((item) => normalizePlaceQuery(item).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    const normalizedCandidates = [];
    for (const value of candidates) {
        const cleaned = value
            .replace(/\b(brasil|brazil)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (cleaned && !normalizedCandidates.includes(cleaned)) {
            normalizedCandidates.push(cleaned);
        }
    }

    return normalizedCandidates.map((item) => item.replace(/\s+/g, '_'));
}

async function fetchWikipediaThumbnail(place) {
    const titles = buildWikipediaTitleCandidates(place);
    const locales = ['pt', 'en'];

    for (const title of titles) {
        for (const locale of locales) {
            try {
                const response = await axios.get(`https://${locale}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'PortalWeb-PlacePhoto/1.0',
                    },
                });

                const thumbnail = response?.data?.thumbnail?.source;
                if (typeof thumbnail === 'string' && /^https?:\/\//i.test(thumbnail)) {
                    return {
                        url: thumbnail,
                        source: `wikipedia-${locale}`,
                        title,
                    };
                }
            } catch (_) {
                // Ignore and continue trying other title/locale combinations.
            }
        }
    }

    return null;
}

async function canUseStreetView(apiKey, latitude, longitude) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/streetview/metadata', {
            timeout: 10000,
            params: {
                location: `${latitude},${longitude}`,
                source: 'outdoor',
                key: apiKey,
            },
        });

        const status = String(response?.data?.status || '').toUpperCase();
        return {
            ok: status === 'OK',
            status,
        };
    } catch (error) {
        return {
            ok: false,
            status: Number(error?.response?.status || 0) ? `HTTP_${error.response.status}` : 'ERROR',
        };
    }
}

async function searchDestinationPhotoName(place) {
    const apiKey = getGoogleMapsApiKey();
    const candidates = buildPlaceSearchCandidates(place);
    let selected = null;
    let fallbackCenter = null;
    const optionsMap = new Map();

    const registerOptions = (places) => {
        if (!Array.isArray(places)) {
            return;
        }

        for (const item of places) {
            const name = String(item?.displayName?.text || '').trim();
            const address = String(item?.formattedAddress || '').trim();
            const key = normalizeTextForComparison(name || address);
            if (!key) {
                continue;
            }

            if (!optionsMap.has(key)) {
                optionsMap.set(key, {
                    name: name || address,
                    address: address || null,
                });
            }
        }
    };

    logPlacePhoto('TextSearch candidates', { place, candidates });

    for (const textQuery of candidates) {
        logPlacePhoto('TextSearch request', { place, textQuery });

        const placesRaw = await searchPlacesByText(textQuery, apiKey);
        registerOptions(placesRaw);
        const places = await hydratePlacesWithDetailsPhotos(placesRaw, apiKey);
        const centerCandidates = places
            .map((item) => ({
                item,
                score: scoreCenterCandidate(item, textQuery),
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => b.score - a.score);

        if (centerCandidates.length > 0) {
            const bestCenter = centerCandidates[0];
            if (!fallbackCenter || bestCenter.score > fallbackCenter.score) {
                fallbackCenter = {
                    latitude: bestCenter.item.location.latitude,
                    longitude: bestCenter.item.location.longitude,
                    sourceQuery: textQuery,
                    sourcePlace: bestCenter.item?.displayName?.text || null,
                    score: bestCenter.score,
                };
            }
        }
        const ranked = places
            .map((item) => ({
                item,
                score: scorePlaceForPhoto(item, textQuery),
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => b.score - a.score);

        logPlacePhoto('TextSearch response', {
            place,
            textQuery,
            totalPlaces: placesRaw.length,
            rankedWithPhoto: ranked.length,
            topMatches: places.slice(0, 3).map((item) => ({
                name: item?.displayName?.text || null,
                address: item?.formattedAddress || null,
                photoCount: Array.isArray(item?.photos) ? item.photos.length : 0,
                airportLike: isAirportLike(item),
            })),
        });

        if (ranked.length > 0) {
            selected = {
                textQuery,
                place: ranked[0].item,
                score: ranked[0].score,
                method: 'textSearch',
            };
            break;
        }
    }

    if (!selected && fallbackCenter) {
        logPlacePhoto('NearbySearch request', {
            place,
            center: {
                latitude: fallbackCenter.latitude,
                longitude: fallbackCenter.longitude,
            },
            sourceQuery: fallbackCenter.sourceQuery,
            sourcePlace: fallbackCenter.sourcePlace,
        });

        const nearbyPlacesRaw = await searchNearbyPhotoPlace(fallbackCenter, apiKey);
        registerOptions(nearbyPlacesRaw);
        const nearbyPlaces = await hydratePlacesWithDetailsPhotos(nearbyPlacesRaw, apiKey);
        const nearbyRanked = nearbyPlaces
            .map((item) => ({
                item,
                score: scorePlaceForPhoto(item, place),
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => b.score - a.score);

        logPlacePhoto('NearbySearch response', {
            place,
            totalPlaces: nearbyPlacesRaw.length,
            rankedWithPhoto: nearbyRanked.length,
            topMatches: nearbyPlaces.slice(0, 5).map((item) => ({
                name: item?.displayName?.text || null,
                address: item?.formattedAddress || null,
                photoCount: Array.isArray(item?.photos) ? item.photos.length : 0,
                airportLike: isAirportLike(item),
            })),
        });

        if (nearbyRanked.length > 0) {
            selected = {
                textQuery: fallbackCenter.sourceQuery,
                place: nearbyRanked[0].item,
                score: nearbyRanked[0].score,
                method: 'nearbySearch',
            };
        }
    }

    const placeWithPhoto = selected?.place || null;
    const photoName = placeWithPhoto?.photos?.[0]?.name;

    logPlacePhoto('Selected photo', {
        place,
        selectedQuery: selected?.textQuery || null,
        selectedScore: selected?.score ?? null,
        selectedMethod: selected?.method || null,
        selectedPlaceName: placeWithPhoto?.displayName?.text || null,
        selectedAddress: placeWithPhoto?.formattedAddress || null,
        fallbackCenter: fallbackCenter
            ? { latitude: fallbackCenter.latitude, longitude: fallbackCenter.longitude }
            : null,
        photoName: typeof photoName === 'string' ? photoName : null,
    });

    return {
        photoName: typeof photoName === 'string' && photoName.trim() ? photoName.trim() : null,
        fallbackCenter: fallbackCenter
            ? { latitude: fallbackCenter.latitude, longitude: fallbackCenter.longitude }
            : null,
        options: Array.from(optionsMap.values()),
    };
}

app.get('/', (req, res) => {
    res.send('Servidor backend rodando.');
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// Extrai texto legível de um HTML removendo tags, scripts, estilos e espaços excessivos
function extrairTextoDoHtml(html) {
    return String(html || '')
        // Remove scripts e estilos com conteúdo
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        // Troca tags de bloco por quebras de linha para preservar separações
        .replace(/<\/?(div|p|br|li|tr|td|th|h[1-6]|section|article|header|footer|main|table|ul|ol)[^>]*>/gi, '\n')
        // Remove todas as outras tags HTML
        .replace(/<[^>]+>/g, ' ')
        // Decodifica entidades HTML comuns
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&[a-z]+;/gi, ' ')
        // Normaliza espaços e linhas em branco
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Endpoint para fazer scraping de URLs de operadores (evita CORS no frontend)
app.post('/api/scrape-url', async (req, res) => {
    let browser = null;
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL não fornecida.' });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (_) {
            return res.status(400).json({ error: 'URL inválida.' });
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ error: 'Apenas URLs http e https são permitidas.' });
        }

        // Usar Puppeteer para capturar conteúdo completo (incluindo JavaScript dinâmico)
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // Configurar User-Agent e headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        });

        // Navegar para a URL e esperar carregar
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Esperar um pouco mais para garantir que JavaScript dinâmico carregou
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Capturar o HTML completo após execução do JavaScript
        const rawHtml = await page.content();

        await browser.close();
        browser = null;

        // Extrai texto limpo para a IA conseguir processar melhor
        const textoLimpo = extrairTextoDoHtml(rawHtml);

        // Limita a 60.000 caracteres para não exceder limites da IA
        const textoFinal = textoLimpo.length > 60000
            ? textoLimpo.substring(0, 60000) + '\n... (conteúdo truncado)'
            : textoLimpo;

        return res.json({
            success: true,
            html: textoFinal,
            contentLength: textoFinal.length,
            rawLength: rawHtml.length,
        });
    } catch (error) {
        if (browser) {
            await browser.close().catch(() => {});
        }
        logServerError('Erro ao fazer scraping da URL:', error);
        const errorMessage = error.message || 'Não foi possível baixar o conteúdo da URL.';
        return res.status(500).json({ error: errorMessage });
    }
});

app.get('/api/place-photo', async (req, res) => {
    const place = normalizePlaceQuery(req.query.place);
    const apiKey = getGoogleMapsApiKey();

    logPlacePhoto('Incoming /api/place-photo', { place });

    if (!place) {
        logPlacePhoto('Missing place param', { place });
        return res.status(400).json({ error: 'Parâmetro place é obrigatório.', photo: null });
    }

    if (!apiKey) {
        logPlacePhoto('Missing GOOGLE_MAPS_API_KEY', { place });
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY não configurada.', photo: null });
    }

    try {
        const result = await searchDestinationPhotoName(place);
        const photoName = result?.photoName || null;
        const fallbackCenter = result?.fallbackCenter || null;
        const options = Array.isArray(result?.options) ? result.options : [];
        const totalPlaces = options.length;

        const baseUrl = buildBackendBaseUrl(req);

        if (photoName) {
            const photoUrl = `${baseUrl}/api/place-photo-media?name=${encodeURIComponent(photoName)}`;

            logPlacePhoto('Returning photo URL', { place, photoName, photoUrl, method: 'placePhotoMedia' });

            return res.json({ photo: photoUrl, totalPlaces, options });
        }

        if (fallbackCenter) {
            const streetViewCheck = await canUseStreetView(apiKey, fallbackCenter.latitude, fallbackCenter.longitude);

            if (streetViewCheck.ok) {
                const streetViewUrl = `${baseUrl}/api/place-photo-streetview?lat=${encodeURIComponent(
                    String(fallbackCenter.latitude)
                )}&lng=${encodeURIComponent(String(fallbackCenter.longitude))}`;

                logPlacePhoto('Returning streetview fallback URL', {
                    place,
                    streetViewUrl,
                    fallbackCenter,
                    streetViewStatus: streetViewCheck.status,
                });

                return res.json({ photo: streetViewUrl, totalPlaces, options });
            }

            const wikipediaFallback = await fetchWikipediaThumbnail(place);
            if (wikipediaFallback) {
                logPlacePhoto('StreetView unavailable, returning wikipedia fallback', {
                    place,
                    fallbackCenter,
                    streetViewStatus: streetViewCheck.status,
                    fallbackSource: wikipediaFallback.source,
                    wikipediaTitle: wikipediaFallback.title,
                    fallbackUrl: wikipediaFallback.url,
                });
                return res.json({ photo: wikipediaFallback.url, totalPlaces, options });
            }

            const staticFallback = buildStaticDestinationFallbackUrl(place);
            logPlacePhoto('StreetView unavailable, returning static fallback', {
                place,
                fallbackCenter,
                streetViewStatus: streetViewCheck.status,
                fallbackSource: staticFallback.source,
                fallbackUrl: staticFallback.url,
            });
            return res.json({ photo: staticFallback.url, totalPlaces, options });
        }

        if (!photoName) {
            logPlacePhoto('No photo found', { place });
            return res.json({ photo: null, totalPlaces, options });
        }
    } catch (error) {
        const parsed = parseAxiosError(error, 'Erro ao consultar foto do destino na Google Places API.');
        return res.status(parsed.status).json({ error: parsed.message, photo: null });
    }
});

app.get('/api/place-lodging', async (req, res) => {
    const place = normalizePlaceQuery(req.query.place);
    const apiKey = getGoogleMapsApiKey();

    logPlaceLodging('Incoming /api/place-lodging', { place });

    if (!place) {
        return res.status(400).json({ error: 'Parâmetro place é obrigatório.', options: [] });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY não configurada.', options: [] });
    }

    try {
        const options = await searchLodgingOptions(place);
        const hasFallback = options.some((o) => o.fallback);
        return res.json({
            totalPlaces: options.length,
            options,
            ...(hasFallback ? { fallback: 'ai-groq' } : {}),
        });
    } catch (error) {
        const status = Number(error?.response?.status || 0);
        if (status === 429) {
            const fallbackOptions = buildQuotaFallbackLodgingOptions(place);
            logPlaceLodging('Quota exceeded, returning fallback options', {
                place,
                totalFallback: fallbackOptions.length,
            });
            return res.json({
                totalPlaces: fallbackOptions.length,
                options: fallbackOptions,
                fallback: 'quota-exceeded',
            });
        }

        // Última tentativa: fallback estático
        const fallbackOptions = buildQuotaFallbackLodgingOptions(place);
        logPlaceLodging('Error /api/place-lodging, returning static fallback', {
            place,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return res.json({
            totalPlaces: fallbackOptions.length,
            options: fallbackOptions,
            fallback: 'static-fallback',
        });
    }
});

app.get('/api/place-restaurants', async (req, res) => {
    const place = normalizePlaceQuery(req.query.place);
    const apiKey = getGoogleMapsApiKey();

    if (!place) {
        return res.status(400).json({ error: 'Parâmetro place é obrigatório.', options: [] });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY não configurada.', options: [] });
    }

    try {
        const options = await searchRestaurantOptions(place);
        const hasFallback = options.some((o) => o.fallback);
        return res.json({
            totalPlaces: options.length,
            options,
            ...(hasFallback ? { fallback: 'ai-groq' } : {}),
        });
    } catch (error) {
        const status = Number(error?.response?.status || 0);
        if (status === 429) {
            const fallbackOptions = buildQuotaFallbackRestaurantOptions(place);
            return res.json({
                totalPlaces: fallbackOptions.length,
                options: fallbackOptions,
                fallback: 'quota-exceeded',
            });
        }

        // Última tentativa: fallback estático
        const fallbackOptions = buildQuotaFallbackRestaurantOptions(place);
        return res.json({
            totalPlaces: fallbackOptions.length,
            options: fallbackOptions,
            fallback: 'static-fallback',
        });
    }
});

app.get('/api/place-experiences', async (req, res) => {
    const place = normalizePlaceQuery(req.query.place);
    const apiKey = getGoogleMapsApiKey();

    if (!place) {
        return res.status(400).json({ error: 'Parâmetro place é obrigatório.', options: [] });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY não configurada.', options: [] });
    }

    try {
        const options = await searchExperienceOptions(place);
        const hasFallback = options.some((o) => o.fallback);
        return res.json({
            totalPlaces: options.length,
            options,
            ...(hasFallback ? { fallback: 'ai-groq' } : {}),
        });
    } catch (error) {
        const status = Number(error?.response?.status || 0);
        if (status === 429) {
            const fallbackOptions = buildQuotaFallbackExperienceOptions(place);
            return res.json({
                totalPlaces: fallbackOptions.length,
                options: fallbackOptions,
                fallback: 'quota-exceeded',
            });
        }

        // Última tentativa: fallback estático
        const fallbackOptions = buildQuotaFallbackExperienceOptions(place);
        return res.json({
            totalPlaces: fallbackOptions.length,
            options: fallbackOptions,
            fallback: 'static-fallback',
        });
    }
});

app.get('/api/place-photo-media', async (req, res) => {
    const apiKey = getGoogleMapsApiKey();
    const photoName = String(req.query.name || '').trim();

    logPlacePhoto('Incoming /api/place-photo-media', { photoName });

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY não configurada.' });
    }

    if (!/^places\/[^/]+\/photos\/[^/]+$/.test(photoName)) {
        logPlacePhoto('Invalid photoName format', { photoName });
        return res.status(400).json({ error: 'Parâmetro name inválido.' });
    }

    try {
        const response = await axios.get(`https://places.googleapis.com/v1/${photoName}/media`, {
            timeout: 15000,
            responseType: 'arraybuffer',
            params: {
                maxHeightPx: 900,
            },
            headers: {
                'X-Goog-Api-Key': apiKey,
            },
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const contentLength = Number(response.headers['content-length'] || 0) || Buffer.byteLength(response.data || []);
        logPlacePhoto('Media fetched', { photoName, contentType, contentLength });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=21600');
        return res.send(Buffer.from(response.data));
    } catch (error) {
        const parsed = parseAxiosError(error, 'Erro ao carregar mídia da foto do destino.');
        return res.status(parsed.status).json({ error: parsed.message });
    }
});

app.get('/api/place-photo-streetview', async (req, res) => {
    const apiKey = getGoogleMapsApiKey();
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);

    logPlacePhoto('Incoming /api/place-photo-streetview', { latitude, longitude });

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY não configurada.' });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return res.status(400).json({ error: 'Parâmetros lat/lng inválidos.' });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/streetview', {
            timeout: 15000,
            responseType: 'arraybuffer',
            params: {
                size: '1280x720',
                location: `${latitude},${longitude}`,
                source: 'outdoor',
                key: apiKey,
            },
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const contentLength = Number(response.headers['content-length'] || 0) || Buffer.byteLength(response.data || []);
        logPlacePhoto('StreetView fetched', { latitude, longitude, contentType, contentLength });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=21600');
        return res.send(Buffer.from(response.data));
    } catch (error) {
        const parsed = parseAxiosError(error, 'Erro ao carregar imagem Street View do destino.');
        return res.status(parsed.status).json({ error: parsed.message });
    }
});

app.post('/api/ai/chat', async (req, res) => {
    try {

        const reply = await AIService.generate(
            req.body.messages,
            req.body.provedor
        );

        res.json({
            reply,
            model: 'llama-3.3-70b-versatile'
        });

    } catch (error) {

        logServerError('Erro IA:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/auth/funcionarios/login', ensureDb, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            `SELECT id, nome, email, cargo, departamento, status, nivel_acesso, foto_url, iniciais, senha_hash
       FROM public.funcionarios
       WHERE email = $1
       LIMIT 1`,
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const funcionario = result.rows[0];

        if (funcionario.status !== 'Ativo') {
            return res.status(403).json({ error: 'Funcionário inativo.' });
        }

        if (!verifyPassword(password, funcionario.senha_hash)) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        res.json({
            message: 'Login realizado com sucesso.',
            funcionario: mapFuncionario(funcionario),
        });
    } catch (error) {
        logServerError('Erro ao autenticar funcionário:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/funcionarios', ensureDb, async (req, res) => {
    try {
        await ensureFuncionariosSaudacoesColumn();

        const result = await pool.query(
            `SELECT id, nome, email, cargo, departamento, status, nivel_acesso, foto_url, iniciais, saudacoes
       FROM public.funcionarios
       ORDER BY nome ASC`
        );

        res.json(result.rows.map(mapFuncionario));
    } catch (error) {
        logServerError('Erro ao listar funcionários:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/funcionarios', ensureDb, async (req, res) => {
    const payload = normalizePayload(req.body);

    if (!payload.name || !payload.email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    try {
        await ensureFuncionariosSaudacoesColumn();

        const result = await pool.query(
            `INSERT INTO public.funcionarios
        (nome, email, senha_hash, cargo, departamento, status, nivel_acesso, foto_url, iniciais, saudacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, nome, email, cargo, departamento, status, nivel_acesso, foto_url, iniciais, saudacoes`,
            [
                payload.name,
                payload.email,
                hashPassword(payload.password),
                payload.role,
                payload.department,
                payload.status,
                payload.accessLevel,
                payload.photo,
                getInitials(payload.name),
                payload.saudacoes,
            ]
        );

        res.status(201).json(mapFuncionario(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe funcionário com este e-mail.' });
        }

        logServerError('Erro ao criar funcionário:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/funcionarios/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizePayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.name || !payload.email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    try {
                await ensureFuncionariosSaudacoesColumn();

        const result = await pool.query(
            `UPDATE public.funcionarios
          SET nome = $1,
              email = $2,
              cargo = $3,
              departamento = $4,
              status = $5,
              nivel_acesso = $6,
              foto_url = $7,
              iniciais = $8,
                            senha_hash = COALESCE($9, senha_hash),
                            saudacoes = $10,
              atualizado_em = NOW()
                WHERE id = $11
            RETURNING id, nome, email, cargo, departamento, status, nivel_acesso, foto_url, iniciais, saudacoes`,
            [
                payload.name,
                payload.email,
                payload.role,
                payload.department,
                payload.status,
                payload.accessLevel,
                payload.photo,
                getInitials(payload.name),
                payload.password.trim() ? hashPassword(payload.password) : null,
                                payload.saudacoes,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }

        res.json(mapFuncionario(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe funcionário com este e-mail.' });
        }

        logServerError('Erro ao atualizar funcionário:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/funcionarios/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.funcionarios WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir funcionário:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/clientes', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
              `SELECT id, nome, nome_completo, email, telefone, cep, endereco, numero, complemento, cidade, estado, status, cpf_cnpj, rg, data_nascimento, documento_nome
       FROM public.clientes
       ORDER BY nome ASC`
        );

        res.json(result.rows.map(mapCliente));
    } catch (error) {
        logServerError('Erro ao listar clientes:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/clientes', ensureDb, async (req, res) => {
    const payload = normalizeClientePayload(req.body);

    if (!payload.nomeCompleto) {
        return res.status(400).json({ error: 'Nome completo é obrigatório.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.clientes
        (nome, nome_completo, email, telefone, cep, endereco, numero, complemento, cidade, estado, status, cpf_cnpj, rg, data_nascimento, documento_nome)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULLIF($14, '')::date, $15)
       RETURNING id, nome, nome_completo, email, telefone, cep, endereco, numero, complemento, cidade, estado, status, cpf_cnpj, rg, data_nascimento, documento_nome`,
            [
                payload.nome || null,
                payload.nomeCompleto,
                payload.email || null,
                payload.telefone || null,
                payload.cep || null,
                payload.endereco || null,
                payload.numero || null,
                payload.complemento || null,
                payload.cidade || null,
                payload.estado || null,
                payload.status,
                payload.cpfCnpj || null,
                payload.rg || null,
                payload.dataNascimento,
                payload.documentoNome || null,
            ]
        );

        res.status(201).json(mapCliente(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe cliente com este CPF/CNPJ.' });
        }

        logServerError('Erro ao criar cliente:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/clientes/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeClientePayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.nomeCompleto) {
        return res.status(400).json({ error: 'Nome completo é obrigatório.' });
    }

    try {
        const result = await pool.query(
                        `UPDATE public.clientes
          SET nome = $1,
              nome_completo = $2,
              email = $3,
              telefone = $4,
              cep = $5,
              endereco = $6,
              numero = $7,
              complemento = $8,
              cidade = $9,
              estado = $10,
              status = $11,
              cpf_cnpj = $12,
              rg = $13,
              data_nascimento = NULLIF($14, '')::date,
              documento_nome = $15,
              atualizado_em = NOW()
          WHERE id = $16
        RETURNING id, nome, nome_completo, email, telefone, cep, endereco, numero, complemento, cidade, estado, status, cpf_cnpj, rg, data_nascimento, documento_nome`,
            [
                payload.nome || null,
                payload.nomeCompleto,
                payload.email || null,
                payload.telefone || null,
                payload.cep || null,
                payload.endereco || null,
                payload.numero || null,
                payload.complemento || null,
                payload.cidade || null,
                payload.estado || null,
                payload.status,
                payload.cpfCnpj || null,
                payload.rg || null,
                payload.dataNascimento,
                payload.documentoNome || null,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        res.json(mapCliente(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe cliente com este CPF/CNPJ.' });
        }

        logServerError('Erro ao atualizar cliente:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/clientes/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.clientes WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir cliente:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/produtos', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nome, codigo, categoria, preco, fornecedor, operadora, unidade, status
       FROM public.produtos
       ORDER BY nome ASC`
        );

        res.json(result.rows.map(mapProduto));
    } catch (error) {
        logServerError('Erro ao listar produtos:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/produtos', ensureDb, async (req, res) => {
    const payload = normalizeProdutoPayload(req.body);

    if (!payload.nome) {
        return res.status(400).json({ error: 'Nome e obrigatorio.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.produtos
        (nome, codigo, categoria, preco, fornecedor, operadora, unidade, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nome, codigo, categoria, preco, fornecedor, operadora, unidade, status`,
            [
                payload.nome,
                payload.codigo || null,
                payload.categoria || null,
                payload.preco,
                payload.fornecedor || null,
                payload.operadora || null,
                payload.unidade,
                payload.status,
            ]
        );

        res.status(201).json(mapProduto(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ja existe produto com este codigo.' });
        }

        logServerError('Erro ao criar produto:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/produtos/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeProdutoPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido.' });
    }

    if (!payload.nome) {
        return res.status(400).json({ error: 'Nome e obrigatorio.' });
    }

    try {
        const result = await pool.query(
            `UPDATE public.produtos
          SET nome = $1,
              codigo = $2,
              categoria = $3,
              preco = $4,
              fornecedor = $5,
              operadora = $6,
              unidade = $7,
              status = $8,
              atualizado_em = NOW()
        WHERE id = $9
      RETURNING id, nome, codigo, categoria, preco, fornecedor, operadora, unidade, status`,
            [
                payload.nome,
                payload.codigo || null,
                payload.categoria || null,
                payload.preco,
                payload.fornecedor || null,
                payload.operadora || null,
                payload.unidade,
                payload.status,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto nao encontrado.' });
        }

        res.json(mapProduto(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ja existe produto com este codigo.' });
        }

        logServerError('Erro ao atualizar produto:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/produtos/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.produtos WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto nao encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir produto:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/fornecedores', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, razao_social, nome_fantasia, cnpj, email, telefone, cep, endereco, complemento, cidade, estado, status, categoria
       FROM public.fornecedores
       ORDER BY razao_social ASC`
        );

        res.json(result.rows.map(mapFornecedor));
    } catch (error) {
        logServerError('Erro ao listar fornecedores:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/fornecedores', ensureDb, async (req, res) => {
    const payload = normalizeFornecedorPayload(req.body);

    if (!payload.razaoSocial) {
        return res.status(400).json({ error: 'Razão social é obrigatória.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.fornecedores
        (razao_social, nome_fantasia, cnpj, email, telefone, cep, endereco, complemento, cidade, estado, status, categoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, razao_social, nome_fantasia, cnpj, email, telefone, cep, endereco, complemento, cidade, estado, status, categoria`,
            [
                payload.razaoSocial,
                payload.nomeFantasia || null,
                payload.cnpj || null,
                payload.email || null,
                payload.telefone || null,
                payload.cep || null,
                payload.endereco || null,
                payload.complemento || null,
                payload.cidade || null,
                payload.estado || null,
                payload.status,
                payload.categoria || null,
            ]
        );

        res.status(201).json(mapFornecedor(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe fornecedor com este CNPJ.' });
        }

        logServerError('Erro ao criar fornecedor:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/fornecedores/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeFornecedorPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.razaoSocial) {
        return res.status(400).json({ error: 'Razão social é obrigatória.' });
    }

    try {
        const result = await pool.query(
            `UPDATE public.fornecedores
          SET razao_social = $1,
              nome_fantasia = $2,
              cnpj = $3,
              email = $4,
              telefone = $5,
              cep = $6,
              endereco = $7,
              complemento = $8,
              cidade = $9,
              estado = $10,
              status = $11,
              categoria = $12,
              atualizado_em = NOW()
        WHERE id = $13
      RETURNING id, razao_social, nome_fantasia, cnpj, email, telefone, cep, endereco, complemento, cidade, estado, status, categoria`,
            [
                payload.razaoSocial,
                payload.nomeFantasia || null,
                payload.cnpj || null,
                payload.email || null,
                payload.telefone || null,
                payload.cep || null,
                payload.endereco || null,
                payload.complemento || null,
                payload.cidade || null,
                payload.estado || null,
                payload.status,
                payload.categoria || null,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado.' });
        }

        res.json(mapFornecedor(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe fornecedor com este CNPJ.' });
        }

        logServerError('Erro ao atualizar fornecedor:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/leads', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nome, email, whatsapp, status, status_crm, viagens, criado_em, atendente
       FROM public.leads
       ORDER BY criado_em DESC, id DESC`
        );

        res.json(result.rows.map(mapLead));
    } catch (error) {
        logServerError('Erro ao listar leads:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/leads', ensureDb, async (req, res) => {
    const payload = normalizeLeadPayload(req.body);

    if (!payload.nome) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.leads
        (nome, email, whatsapp, status, status_crm, viagens, criado_em, atendente)
       VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::date, $8)
       RETURNING id, nome, email, whatsapp, status, status_crm, viagens, criado_em, atendente`,
            [
                payload.nome,
                payload.email || null,
                payload.whatsapp || null,
                payload.status,
                payload.statusCrm,
                payload.viagens,
                payload.criadoEm,
                payload.atendente || null,
            ]
        );

        res.status(201).json(mapLead(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao criar lead:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/leads/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeLeadPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.nome) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    try {
        const result = await pool.query(
            `UPDATE public.leads
          SET nome = $1,
              email = $2,
              whatsapp = $3,
              status = $4,
              status_crm = $5,
              viagens = $6,
              criado_em = NULLIF($7, '')::date,
              atendente = $8,
              atualizado_em = NOW()
        WHERE id = $9
      RETURNING id, nome, email, whatsapp, status, status_crm, viagens, criado_em, atendente`,
            [
                payload.nome,
                payload.email || null,
                payload.whatsapp || null,
                payload.status,
                payload.statusCrm,
                payload.viagens,
                payload.criadoEm,
                payload.atendente || null,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Lead não encontrado.' });
        }

        res.json(mapLead(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao atualizar lead:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/leads/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.leads WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Lead não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir lead:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/tarefas', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, titulo, descricao, responsavel, prioridade, status, prazo, categoria
       FROM public.tarefas
       ORDER BY criado_em DESC, id DESC`
        );

        res.json(result.rows.map(mapTarefa));
    } catch (error) {
        logServerError('Erro ao listar tarefas:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/tarefas', ensureDb, async (req, res) => {
    const payload = normalizeTarefaPayload(req.body);

    if (!payload.titulo) {
        return res.status(400).json({ error: 'Título é obrigatório.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.tarefas
        (titulo, descricao, responsavel, prioridade, status, prazo, categoria)
       VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7)
       RETURNING id, titulo, descricao, responsavel, prioridade, status, prazo, categoria`,
            [
                payload.titulo,
                payload.descricao || null,
                payload.responsavel || null,
                payload.prioridade,
                payload.status,
                payload.prazo,
                payload.categoria || null,
            ]
        );

        res.status(201).json(mapTarefa(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao criar tarefa:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/tarefas/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeTarefaPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.titulo) {
        return res.status(400).json({ error: 'Título é obrigatório.' });
    }

    try {
        const result = await pool.query(
            `UPDATE public.tarefas
          SET titulo = $1,
              descricao = $2,
              responsavel = $3,
              prioridade = $4,
              status = $5,
              prazo = NULLIF($6, '')::date,
              categoria = $7,
              atualizado_em = NOW()
        WHERE id = $8
      RETURNING id, titulo, descricao, responsavel, prioridade, status, prazo, categoria`,
            [
                payload.titulo,
                payload.descricao || null,
                payload.responsavel || null,
                payload.prioridade,
                payload.status,
                payload.prazo,
                payload.categoria || null,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }

        res.json(mapTarefa(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao atualizar tarefa:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/tarefas/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.tarefas WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir tarefa:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/eventos', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, titulo, descricao, data_evento, hora, tipo, cliente, agente
       FROM public.eventos
       ORDER BY data_evento ASC, hora ASC, id ASC`
        );

        res.json(result.rows.map(mapEvento));
    } catch (error) {
        logServerError('Erro ao listar eventos:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/eventos', ensureDb, async (req, res) => {
    const payload = normalizeEventoPayload(req.body);

    if (!payload.titulo || !payload.data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.eventos
        (titulo, descricao, data_evento, hora, tipo, cliente, agente)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7)
       RETURNING id, titulo, descricao, data_evento, hora, tipo, cliente, agente`,
            [
                payload.titulo,
                payload.descricao || null,
                payload.data,
                payload.hora || null,
                payload.tipo,
                payload.cliente || null,
                payload.agente || null,
            ]
        );

        res.status(201).json(mapEvento(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao criar evento:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/eventos/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeEventoPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.titulo || !payload.data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            `UPDATE public.eventos
          SET titulo = $1,
              descricao = $2,
              data_evento = $3::date,
              hora = $4,
              tipo = $5,
              cliente = $6,
              agente = $7,
              atualizado_em = NOW()
        WHERE id = $8
      RETURNING id, titulo, descricao, data_evento, hora, tipo, cliente, agente`,
            [
                payload.titulo,
                payload.descricao || null,
                payload.data,
                payload.hora || null,
                payload.tipo,
                payload.cliente || null,
                payload.agente || null,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        res.json(mapEvento(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao atualizar evento:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/eventos/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.eventos WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir evento:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/orcamentos', ensureDb, async (req, res) => {
    try {
        await ensureOrcamentosDestinoColumn();
        await ensureOrcamentosPassageirosColumn();
        await ensureOrcamentosPagamentoColumns();
        await ensureOrcamentosPacotesColumn();
        await ensureOrcamentosPerfilViagemColumn();
        await ensureOrcamentosPromptPerfilIaColumn();
        await ensureOrcamentosPromptRoteiroIaColumn();
        await backfillOrcamentosPublicToken();

        const result = await pool.query(
            `SELECT id, numero, public_token, cliente, email, destino, agente_viagem, status, data_criacao, data_validade, observacoes,
                            itens, pacotes, voos, hospedagem, roteiro, prompt_roteiro_ia, day_by_day, transporte, restaurante, experiencias, seguro, perfil_viagem, prompt_perfil_ia, passageiros,
                            forma_pagamento, parcelas, status_viagem
       FROM public.orcamentos
       ORDER BY data_criacao DESC, id DESC`
        );

        res.json(result.rows.map(mapOrcamento));
    } catch (error) {
        logServerError('Erro ao listar orçamentos:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/orcamentos/numero/:numero', ensureDb, async (req, res) => {
    const numero = String(req.params.numero || '').trim();

    if (!numero) {
        return res.status(400).json({ error: 'Número do orçamento é obrigatório.' });
    }

    try {
        await ensureOrcamentosDestinoColumn();
        await ensureOrcamentosPassageirosColumn();
        await ensureOrcamentosPagamentoColumns();
        await ensureOrcamentosPacotesColumn();
        await ensureOrcamentosPerfilViagemColumn();
        await ensureOrcamentosPromptPerfilIaColumn();
        await ensureOrcamentosPromptRoteiroIaColumn();
        await backfillOrcamentosPublicToken();

        const result = await pool.query(
            `SELECT id, numero, public_token, cliente, email, destino, agente_viagem, status, data_criacao, data_validade, observacoes,
                            itens, pacotes, voos, hospedagem, roteiro, prompt_roteiro_ia, day_by_day, transporte, restaurante, experiencias, seguro, perfil_viagem, prompt_perfil_ia, passageiros,
                            forma_pagamento, parcelas, status_viagem
               FROM public.orcamentos
              WHERE numero = $1
              LIMIT 1`,
            [numero]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }

        res.json(mapOrcamento(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao buscar orçamento por número:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/orcamentos/public/:publicToken', ensureDb, async (req, res) => {
    const publicToken = String(req.params.publicToken || '').trim();

    if (!publicToken) {
        return res.status(400).json({ error: 'Token público do orçamento é obrigatório.' });
    }

    try {
        await ensureOrcamentosDestinoColumn();
        await ensureOrcamentosPassageirosColumn();
        await ensureOrcamentosPagamentoColumns();
        await ensureOrcamentosPacotesColumn();
        await ensureOrcamentosPerfilViagemColumn();
        await ensureOrcamentosPromptPerfilIaColumn();
        await ensureOrcamentosPromptRoteiroIaColumn();
        await backfillOrcamentosPublicToken();

        const result = await pool.query(
            `SELECT id, numero, public_token, cliente, email, destino, agente_viagem, status, data_criacao, data_validade, observacoes,
                            itens, pacotes, voos, hospedagem, roteiro, prompt_roteiro_ia, day_by_day, transporte, restaurante, experiencias, seguro, perfil_viagem, prompt_perfil_ia, passageiros,
                            forma_pagamento, parcelas, status_viagem
               FROM public.orcamentos
              WHERE public_token = $1
              LIMIT 1`,
            [publicToken]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }

        res.json(mapOrcamento(result.rows[0]));
    } catch (error) {
        logServerError('Erro ao buscar orçamento por token:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/orcamentos', ensureDb, async (req, res) => {
    const payload = normalizeOrcamentoPayload(req.body);

    if (!payload.numero || !payload.cliente) {
        return res.status(400).json({ error: 'Número e cliente são obrigatórios.' });
    }

    try {
        await ensureOrcamentosDestinoColumn();
        await ensureOrcamentosPassageirosColumn();
        await ensureOrcamentosPagamentoColumns();
        await ensureOrcamentosPacotesColumn();
        await ensureOrcamentosPerfilViagemColumn();
        await ensureOrcamentosPromptPerfilIaColumn();
        await ensureOrcamentosPromptRoteiroIaColumn();
        await ensureOrcamentosPublicTokenColumn();
        await ensureOrcamentosStatusViagemColumn();

        const publicToken = crypto.randomUUID();
        const result = await pool.query(
            `INSERT INTO public.orcamentos
        (numero, cliente, email, destino, agente_viagem, status, status_viagem, data_criacao, data_validade, observacoes,
                 itens, pacotes, voos, hospedagem, roteiro, prompt_roteiro_ia, day_by_day, transporte, restaurante, experiencias, seguro, perfil_viagem, prompt_perfil_ia, passageiros,
         public_token,
         forma_pagamento, parcelas)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')::date, NULLIF($9, '')::date, $10,
                             $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb, $22::jsonb, $23, $24::jsonb,
                             $25, $26, $27)
           RETURNING id, numero, public_token, cliente, email, destino, agente_viagem, status, status_viagem, data_criacao, data_validade, observacoes,
                                 itens, pacotes, voos, hospedagem, roteiro, prompt_roteiro_ia, day_by_day, transporte, restaurante, experiencias, seguro, perfil_viagem, prompt_perfil_ia, passageiros,
                 forma_pagamento, parcelas`,
            [
                payload.numero,
                payload.cliente,
                payload.email || null,
                payload.destino || null,
                payload.agenteViagem || null,
                payload.status,
                payload.statusViagem || null,
                payload.dataCriacao,
                payload.dataValidade,
                payload.observacoes || null,
                JSON.stringify(payload.itens),
                JSON.stringify(payload.pacotes),
                JSON.stringify(payload.voos),
                JSON.stringify(payload.hospedagem),
                payload.roteiro || null,
                payload.promptRoteiroIA || null,
                JSON.stringify(payload.dayByDay),
                JSON.stringify(payload.transporte),
                JSON.stringify(payload.restaurante),
                JSON.stringify(payload.experiencias),
                JSON.stringify(payload.seguro),
                JSON.stringify(payload.perfilViagem),
                payload.promptPerfilViagemIA || null,
                JSON.stringify(payload.passageiros),
                publicToken,
                payload.formaPagamento || null,
                payload.parcelas,
            ]
        );

        res.status(201).json(mapOrcamento(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe orçamento com este número.' });
        }

        logServerError('Erro ao criar orçamento:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/orcamentos/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeOrcamentoPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.numero || !payload.cliente) {
        return res.status(400).json({ error: 'Número e cliente são obrigatórios.' });
    }

    try {
        await ensureOrcamentosDestinoColumn();
        await ensureOrcamentosPassageirosColumn();
        await ensureOrcamentosPagamentoColumns();
        await ensureOrcamentosPacotesColumn();
        await ensureOrcamentosPerfilViagemColumn();
        await ensureOrcamentosPromptPerfilIaColumn();
        await ensureOrcamentosPromptRoteiroIaColumn();
        await ensureOrcamentosPublicTokenColumn();
        await ensureOrcamentosStatusViagemColumn();
        const existing = await pool.query('SELECT public_token FROM public.orcamentos WHERE id = $1', [id]);
        const existingToken = existing.rows[0]?.public_token || crypto.randomUUID();

        const result = await pool.query(
            `UPDATE public.orcamentos
          SET numero = $1,
              cliente = $2,
              email = $3,
                            destino = $4,
                            agente_viagem = $5,
                            status = $6,
                            status_viagem = $7,
                            data_criacao = NULLIF($8, '')::date,
                            data_validade = NULLIF($9, '')::date,
                            observacoes = $10,
                            itens = $11::jsonb,
                            pacotes = $12::jsonb,
                            voos = $13::jsonb,
                            hospedagem = $14::jsonb,
                            roteiro = $15,
                            prompt_roteiro_ia = $16,
                            day_by_day = $17::jsonb,
                            transporte = $18::jsonb,
                            restaurante = $19::jsonb,
                            experiencias = $20::jsonb,
                            seguro = $21::jsonb,
                            perfil_viagem = $22::jsonb,
                            prompt_perfil_ia = $23,
                            passageiros = $24::jsonb,
                            public_token = COALESCE(NULLIF(public_token, ''), $25),
                            forma_pagamento = $26,
                            parcelas = $27,
              atualizado_em = NOW()
                                WHERE id = $28
            RETURNING id, numero, public_token, cliente, email, destino, agente_viagem, status, status_viagem, data_criacao, data_validade, observacoes,
                itens, pacotes, voos, hospedagem, roteiro, prompt_roteiro_ia, day_by_day, transporte, restaurante, experiencias, seguro, perfil_viagem, prompt_perfil_ia, passageiros,
                forma_pagamento, parcelas`,
            [
                payload.numero,
                payload.cliente,
                payload.email || null,
                payload.destino || null,
                payload.agenteViagem || null,
                payload.status,
                payload.statusViagem || null,
                payload.dataCriacao,
                payload.dataValidade,
                payload.observacoes || null,
                JSON.stringify(payload.itens),
                JSON.stringify(payload.pacotes),
                JSON.stringify(payload.voos),
                JSON.stringify(payload.hospedagem),
                payload.roteiro || null,
                payload.promptRoteiroIA || null,
                JSON.stringify(payload.dayByDay),
                JSON.stringify(payload.transporte),
                JSON.stringify(payload.restaurante),
                JSON.stringify(payload.experiencias),
                JSON.stringify(payload.seguro),
                JSON.stringify(payload.perfilViagem),
                payload.promptPerfilViagemIA || null,
                JSON.stringify(payload.passageiros),
                existingToken,
                payload.formaPagamento || null,
                payload.parcelas,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }

        res.json(mapOrcamento(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Já existe orçamento com este número.' });
        }

        logServerError('Erro ao atualizar orçamento:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/orcamentos/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.orcamentos WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Orçamento não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir orçamento:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.get('/api/financeiro', ensureDb, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT f.id, f.tipo, f.descricao, f.valor, f.data_lancamento, f.oculto, f.orcamento_pago, f.forma_pagamento, f.parcelas, f.orcamento_id, o.numero AS orcamento_numero, o.cliente
       FROM public.financeiro f
       LEFT JOIN public.orcamentos o ON o.id = f.orcamento_id
       ORDER BY f.data_lancamento DESC, f.id DESC`
        );

        res.json(result.rows.map(mapLancamentoFinanceiro));
    } catch (error) {
        logServerError('Erro ao listar lançamentos financeiros:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.post('/api/financeiro', ensureDb, async (req, res) => {
    const payload = normalizeLancamentoFinanceiroPayload(req.body);

    if (!payload.descricao) {
        return res.status(400).json({ error: 'Descrição é obrigatória.' });
    }

    if (!payload.valor || !Number.isFinite(payload.valor) || payload.valor <= 0) {
        return res.status(400).json({ error: 'Valor deve ser maior que zero.' });
    }

    if (!payload.data) {
        return res.status(400).json({ error: 'Data é obrigatória.' });
    }

    if (payload.orcamentoPago && (!payload.formaPagamento || !payload.parcelas)) {
        return res.status(400).json({ error: 'Informe forma de pagamento e parcelas para receita com orçamento quitado.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.financeiro (tipo, descricao, valor, data_lancamento, oculto, orcamento_pago, forma_pagamento, parcelas, orcamento_id)
       VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, $6, NULLIF($7, ''), $8, $9)
       RETURNING id`,
            [
                payload.tipo,
                payload.descricao,
                payload.valor,
                payload.data,
                payload.oculto,
                payload.orcamentoPago,
                payload.formaPagamento,
                payload.parcelas,
                payload.orcamentoId,
            ]
        );

        const enriched = await pool.query(
            `SELECT f.id, f.tipo, f.descricao, f.valor, f.data_lancamento, f.oculto, f.orcamento_pago, f.forma_pagamento, f.parcelas, f.orcamento_id, o.numero AS orcamento_numero, o.cliente
       FROM public.financeiro f
       LEFT JOIN public.orcamentos o ON o.id = f.orcamento_id
       WHERE f.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(mapLancamentoFinanceiro(enriched.rows[0]));
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Orçamento selecionado não existe.' });
        }

        if (error.code === '23505') {
            return res.status(409).json({ error: 'A receita deste orçamento já foi lançada.' });
        }

        logServerError('Erro ao criar lançamento financeiro:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.put('/api/financeiro/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);
    const payload = normalizeLancamentoFinanceiroPayload(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!payload.descricao) {
        return res.status(400).json({ error: 'Descrição é obrigatória.' });
    }

    if (!payload.valor || !Number.isFinite(payload.valor) || payload.valor <= 0) {
        return res.status(400).json({ error: 'Valor deve ser maior que zero.' });
    }

    if (!payload.data) {
        return res.status(400).json({ error: 'Data é obrigatória.' });
    }

    if (payload.orcamentoPago && (!payload.formaPagamento || !payload.parcelas)) {
        return res.status(400).json({ error: 'Informe forma de pagamento e parcelas para receita com orçamento quitado.' });
    }

    try {
        const result = await pool.query(
            `UPDATE public.financeiro
          SET tipo = $1,
              descricao = $2,
              valor = $3,
              data_lancamento = NULLIF($4, '')::date,
              oculto = $5,
              orcamento_pago = $6,
              forma_pagamento = NULLIF($7, ''),
              parcelas = $8,
              orcamento_id = $9,
              atualizado_em = NOW()
        WHERE id = $10
      RETURNING id`,
            [
                payload.tipo,
                payload.descricao,
                payload.valor,
                payload.data,
                payload.oculto,
                payload.orcamentoPago,
                payload.formaPagamento,
                payload.parcelas,
                payload.orcamentoId,
                id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Lançamento não encontrado.' });
        }

        const updated = await pool.query(
            `SELECT f.id, f.tipo, f.descricao, f.valor, f.data_lancamento, f.oculto, f.orcamento_pago, f.forma_pagamento, f.parcelas, f.orcamento_id, o.numero AS orcamento_numero, o.cliente
       FROM public.financeiro f
       LEFT JOIN public.orcamentos o ON o.id = f.orcamento_id
       WHERE f.id = $1`,
            [id]
        );

        res.json(mapLancamentoFinanceiro(updated.rows[0]));
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Orçamento selecionado não existe.' });
        }

        if (error.code === '23505') {
            return res.status(409).json({ error: 'A receita deste orçamento já foi lançada.' });
        }

        logServerError('Erro ao atualizar lançamento financeiro:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

app.delete('/api/financeiro/:id', ensureDb, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        const result = await pool.query('DELETE FROM public.financeiro WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Lançamento não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        logServerError('Erro ao excluir lançamento financeiro:', error);
        const dbError = resolveDatabaseError(error);
        res.status(dbError.status).json({ error: dbError.message });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: FRONTEND_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

let whatsappClient = null;
let whatsappClientInitializing = null;
let whatsappReady = false;
let latestQr = null;
let whatsappBooting = false;
let whatsappChatsApiUnavailable = false;

function formatMessageTimestamp(unixSeconds) {
    const value = Number(unixSeconds);
    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }
    return value;
}

function getMessageBody(message) {
    if (typeof message.body === 'string' && message.body.trim()) {
        return message.body;
    }

    if (typeof message.caption === 'string' && message.caption.trim()) {
        return message.caption;
    }

    if (message.type) {
        return `[${message.type}]`;
    }

    return '';
}

function serializeChat(chat) {
    const id = chat?.id?._serialized || '';
    const name =
        chat?.name ||
        chat?.formattedTitle ||
        chat?.id?.user ||
        (chat?.isGroup ? 'Grupo sem nome' : 'Contato sem nome');
    const lastBody = chat?.lastMessage ? getMessageBody(chat.lastMessage) : '';
    const timestamp = formatMessageTimestamp(chat?.timestamp || chat?.lastMessage?.timestamp);

    return {
        id,
        name,
        isGroup: Boolean(chat?.isGroup),
        unreadCount: Number(chat?.unreadCount || 0),
        lastMessage: lastBody,
        timestamp,
        historyAvailable: true,
    };
}

function getErrorMessage(error) {
    if (!error) {
        return 'Erro desconhecido.';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error) {
        return error.message || 'Erro sem mensagem.';
    }

    if (typeof error.message === 'string') {
        return error.message;
    }

    try {
        return JSON.stringify(error);
    } catch (_) {
        return 'Falha ao serializar erro.';
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeMessage(message) {
    return {
        id: message?.id?._serialized || `${Date.now()}-${Math.random()}`,
        chatId: message?.fromMe ? message?.to : message?.from,
        from: message?.from || '',
        fromMe: Boolean(message?.fromMe),
        body: getMessageBody(message),
        timestamp: formatMessageTimestamp(message?.timestamp) || Math.floor(Date.now() / 1000),
    };
}

function serializeContactAsChat(contact) {
    const id = contact?.id?._serialized || '';
    if (!id) {
        return null;
    }

    const name =
        contact?.pushname ||
        contact?.name ||
        contact?.shortName ||
        contact?.number ||
        id.replace(/@.*/, '');

    return {
        id,
        name,
        isGroup: false,
        unreadCount: 0,
        lastMessage: '',
        timestamp: null,
        historyAvailable: false,
    };
}

async function listContactsFallback() {
    let contacts = null;
    let contactsError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            contacts = await whatsappClient.getContacts();
            break;
        } catch (error) {
            contactsError = error;
            const message = getErrorMessage(error);
            logServerError(`Tentativa ${attempt + 1} de listar contatos falhou:`, message);
            await delay(300 * (attempt + 1));
        }
    }

    if (!Array.isArray(contacts)) {
        throw new Error(`Falha ao listar contatos: ${getErrorMessage(contactsError)}`);
    }

    return contacts
        .map((contact) => serializeContactAsChat(contact))
        .filter(Boolean)
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
}

function bindWhatsAppEvents(client) {
    client.on('loading_screen', (percent, message) => {
        logServerError('CARREGANDO WHATSAPP:', percent, message);
        io.emit('message', `Carregando: ${message}`);
    });

    client.on('qr', (qr) => {
        logServerError('QR Code recebido, enviando para o frontend...');
        latestQr = qr;
        whatsappReady = false;
        io.emit('qr', qr);
        io.emit('status', { connected: false, waitingQr: true });
    });

    client.on('ready', () => {
        logServerError('Cliente WhatsApp está pronto!');
        whatsappReady = true;
        whatsappBooting = false;
        latestQr = null;
        io.emit('ready', 'Cliente conectado com sucesso!');
        io.emit('status', { connected: true, waitingQr: false });
    });

    client.on('auth_failure', (msg) => {
        logServerError('FALHA NA AUTENTICAÇÃO', msg);
        whatsappReady = false;
        whatsappBooting = false;
        io.emit('message', `Falha na autenticação: ${msg}`);
        io.emit('status', { connected: false, waitingQr: false });
    });

    client.on('disconnected', (reason) => {
        logServerError('Cliente WhatsApp desconectado:', reason);
        whatsappReady = false;
        whatsappBooting = false;
        latestQr = null;
        io.emit('message', `WhatsApp desconectado: ${reason}`);
        io.emit('status', { connected: false, waitingQr: false });
    });

    client.on('message', (msg) => {
        io.emit('incoming_message', serializeMessage(msg));

        msg
            .getChat()
            .then((chat) => {
                io.emit('wa:chat_upsert', serializeChat(chat));
            })
            .catch(() => {
                // Ignora falhas pontuais na atualização da lista de chats.
            });
    });

    client.on('message_create', (msg) => {
        if (!msg.fromMe) {
            return;
        }

        io.emit('incoming_message', serializeMessage(msg));

        msg
            .getChat()
            .then((chat) => {
                io.emit('wa:chat_upsert', serializeChat(chat));
            })
            .catch(() => {
                // Ignora falhas pontuais na atualização da lista de chats.
            });
    });
}

async function sendChatsToSocket(socket) {
    if (!whatsappReady || !whatsappClient) {
        socket.emit('wa:error', { code: 'NOT_READY', message: 'WhatsApp ainda não está pronto.' });
        return;
    }

    if (whatsappChatsApiUnavailable) {
        try {
            const fallbackChats = await listContactsFallback();
            socket.emit('wa:chats', fallbackChats);
            socket.emit('message', 'Modo compatibilidade ativo: exibindo contatos.');
            return;
        } catch (error) {
            socket.emit('wa:chats', []);
            socket.emit('message', `Falha ao listar contatos: ${getErrorMessage(error)}`);
            return;
        }
    }

    let chats = null;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            chats = await whatsappClient.getChats();
            break;
        } catch (error) {
            lastError = error;
            const message = getErrorMessage(error);
            logServerError(`Tentativa ${attempt + 1} de listar chats falhou:`, message);
            await delay(350 * (attempt + 1));
        }
    }

    if (!Array.isArray(chats)) {
        // Fallback para ambientes em que getChats pode falhar mesmo após ready.
        try {
            const chatsErrorMessage = getErrorMessage(lastError);
            if (chatsErrorMessage === 'r') {
                whatsappChatsApiUnavailable = true;
            }

            const serializedFromContacts = await listContactsFallback();

            socket.emit('wa:chats', serializedFromContacts);
            socket.emit('message', 'Chats indisponíveis temporariamente; exibindo contatos como fallback.');
            return;
        } catch (error) {
            const chatsErrorMessage = getErrorMessage(lastError);
            const fallbackError = getErrorMessage(error);
            logServerError(`Falha no fallback de chats (${chatsErrorMessage}) (${fallbackError}).`);
            socket.emit('wa:chats', []);
            socket.emit('message', 'WhatsApp sincronizando. Tente atualizar chats novamente em alguns segundos.');
            return;
        }
    }

    const serialized = [];

    for (const chat of chats) {
        try {
            const mapped = serializeChat(chat);
            if (mapped.id) {
                serialized.push(mapped);
            }
        } catch (error) {
            logServerError('Chat ignorado por erro de serialização:', getErrorMessage(error));
        }
    }

    serialized.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    socket.emit('wa:chats', serialized);
}

async function sendMessagesToSocket(socket, chatId, limit = 120) {
    if (!whatsappReady || !whatsappClient) {
        socket.emit('wa:error', { code: 'NOT_READY', message: 'WhatsApp ainda não está pronto.' });
        return;
    }

    if (!chatId) {
        socket.emit('wa:error', { code: 'INVALID_CHAT', message: 'Chat inválido.' });
        return;
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 120, 20), 300);
    let serialized = [];

    try {
        const chat = await whatsappClient.getChatById(chatId);
        const messages = await chat.fetchMessages({ limit: parsedLimit });
        serialized = messages.map((message) => serializeMessage(message));
    } catch (error) {
        const detail = getErrorMessage(error);
        if (detail === 'r') {
            socket.emit('message', 'Histórico indisponível no modo atual.');
            socket.emit('wa:messages', { chatId, messages: [] });
            return;
        }

        throw error;
    }

    socket.emit('wa:messages', {
        chatId,
        messages: serialized,
    });
}

function registerWhatsAppSocketEvents(socket) {
    socket.on('wa:getChats', async () => {
        try {
            await sendChatsToSocket(socket);
        } catch (error) {
            const detail = getErrorMessage(error);
            logServerError('Erro ao listar chats do WhatsApp:', detail);
            socket.emit('wa:error', {
                code: 'LIST_CHATS_FAILED',
                message: 'Não foi possível listar os chats.',
                detail,
            });
        }
    });

    socket.on('wa:getMessages', async (payload = {}) => {
        try {
            await sendMessagesToSocket(socket, payload.chatId, payload.limit);
        } catch (error) {
            const detail = getErrorMessage(error);
            logServerError('Erro ao carregar mensagens do WhatsApp:', detail);
            socket.emit('wa:error', {
                code: 'LIST_MESSAGES_FAILED',
                message: 'Não foi possível carregar as mensagens.',
                detail,
            });
        }
    });
}

function ensureWhatsAppClient() {
    if (!whatsappClient) {
        whatsappClient = new Client({
            authStrategy: new LocalAuth({ dataPath: WHATSAPP_AUTH_PATH }),
            webVersionCache: {
                type: 'local',
                path: WHATSAPP_CACHE_PATH,
            },
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });
        bindWhatsAppEvents(whatsappClient);
    }

    if (whatsappReady) {
        return Promise.resolve();
    }

    if (whatsappBooting) {
        return Promise.resolve();
    }

    if (whatsappClientInitializing) {
        return whatsappClientInitializing;
    }

    logServerError('Inicializando cliente do WhatsApp...');
    whatsappBooting = true;
    whatsappClientInitializing = whatsappClient
        .initialize()
        .catch((error) => {
            const message = getErrorMessage(error);
            if (message.includes('browser is already running for')) {
                logServerError('Sessão do WhatsApp já está em uso por inicialização ativa. Aguardando ficar pronta.');
                io.emit('message', 'Sessão do WhatsApp já está inicializando. Aguarde alguns segundos.');
                return;
            }

            whatsappBooting = false;
            logServerError('Erro ao inicializar cliente do WhatsApp:', message);
            io.emit('message', `Não foi possível inicializar o WhatsApp: ${message}`);
            io.emit('status', { connected: false, waitingQr: false });
        })
        .finally(() => {
            whatsappClientInitializing = null;
        });

    return whatsappClientInitializing;
}

io.on('connection', (socket) => {
    logServerError('Frontend conectado via Socket.IO');
    socket.emit('message', 'Conectado ao servidor. Aguardando inicialização do WhatsApp...');
    socket.emit('message', 'Iniciando cliente do WhatsApp no servidor...');
    socket.emit('status', { connected: whatsappReady, waitingQr: !whatsappReady });

    if (latestQr) {
        socket.emit('qr', latestQr);
    }

    if (whatsappReady) {
        socket.emit('ready', 'Cliente conectado com sucesso!');
    }

    registerWhatsAppSocketEvents(socket);

    ensureWhatsAppClient().catch((error) => {
        logServerError('Falha inesperada ao garantir cliente do WhatsApp:', error);
        socket.emit('message', 'Falha inesperada ao iniciar cliente do WhatsApp.');
    });
});

server.listen(PORT, () => {
    logServerError(`Servidor ouvindo na porta ${PORT}`);
});



