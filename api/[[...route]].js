module.exports = async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const pathname = (req.url || '/').split('?')[0] || '/';
  const route = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const resource = route[0] || 'health';
  const id = route[1] ? Number(route[1]) : null;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const parseBody = async () => {
    if (req.body && typeof req.body === 'object') {
      return req.body;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    if (!chunks.length) {
      return {};
    }

    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  };

  const body = method !== 'GET' ? await parseBody() : {};

  const json = (status, payload) => {
    res.status(status).json(payload);
  };

  if (resource === 'health') {
    return json(200, { ok: true, app: 'vercel-only', mode: 'single-project' });
  }

  if (resource === 'ai' && route[1] === 'chat') {
    return json(200, {
      reply: 'API Vercel-only ativa. Configure as rotas reais do backend conforme a sua regra de negócio.',
    });
  }

  if (resource === 'place-photo') {
    return json(200, { photo: null, totalPlaces: 0, options: [] });
  }

  if (resource === 'place-photo-media' || resource === 'place-photo-streetview') {
    return json(200, { ok: true, resource });
  }

  if (resource === 'scrape-url') {
    return json(200, {
      success: true,
      html: 'Conteúdo de teste da API Vercel-only. Configure o scraper real quando necessário.',
      contentLength: 90,
      rawLength: 90,
    });
  }

  switch (resource) {
    case 'clientes':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'leads':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'fornecedores':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'funcionarios':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'produtos':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'tarefas':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'eventos':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'financeiro':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    case 'orcamentos':
      if (method === 'GET') return json(200, []);
      if (method === 'POST') return json(201, { id: Date.now(), ...body });
      if (method === 'PUT') return json(200, { id, ...body });
      if (method === 'DELETE') return json(204, {});
      break;

    default:
      return json(404, { error: 'Route not found', path: pathname, resource });
  }
};

