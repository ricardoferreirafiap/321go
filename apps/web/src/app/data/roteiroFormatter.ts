type FormatarRoteiroOptions = {
  destinosFallback?: string[];
};

export function formatarRespostaRoteiroParaCampo(respostaFinal: string, options?: FormatarRoteiroOptions): string {
  const possivelJson = normalizarJsonPossivel(respostaFinal);
  const roteiroFormatado = formatarRoteiroEstruturado(possivelJson, options);
  const roteiroGerado = removerSecaoEvidenciasDosLugares(roteiroFormatado || respostaFinal);

  // Remove tags HTML para evitar poluicao visual no campo.
  return roteiroGerado.replace(/<[^>]*>/g, '').trim();
}

function removerSecaoEvidenciasDosLugares(texto: string): string {
  const linhas = String(texto || '').split(/\r?\n/);
  const indiceSecao = linhas.findIndex((linha) => {
    const normalizada = String(linha || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return /(?:^|\s)(?:\d+[).]\s*)?evidencias\s+dos\s+lugares\b/.test(normalizada);
  });

  if (indiceSecao === -1) {
    return texto;
  }

  return linhas.slice(0, indiceSecao).join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function normalizarJsonPossivel(texto: string): unknown | null {
  const limpo = String(texto || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  if (!limpo || (!limpo.startsWith('{') && !limpo.startsWith('['))) {
    return null;
  }

  try {
    return JSON.parse(limpo);
  } catch {
    return null;
  }
}

function formatarDataRoteiro(valor: unknown): string {
  const texto = String(valor || '').trim();
  if (!texto) return '';

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) {
    return texto;
  }

  return texto;
}

function textoOuVazio(valor: unknown): string {
  return String(valor || '').trim();
}

function normalizarDestinosFallback(destinos: string[] | undefined): string[] {
  const lista = Array.isArray(destinos) ? destinos : [];
  const unicos = new Set<string>();

  for (const item of lista) {
    const destino = textoOuVazio(item);
    if (!destino || ehDestinoNaoInformado(destino)) continue;
    unicos.add(destino);
  }

  return Array.from(unicos);
}

function ehDestinoNaoInformado(valor: string): boolean {
  const normalizado = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return (
    normalizado === 'nao informado' ||
    normalizado === 'nao informada' ||
    normalizado === 'destino nao informado' ||
    normalizado === 'destino nao informada' ||
    normalizado === 'destino: nao informado' ||
    normalizado === 'destino: nao informada' ||
    normalizado === 'n/a' ||
    normalizado === 'na' ||
    normalizado === 'unknown'
  );
}

function formatarRoteiroEstruturado(valor: unknown, options?: FormatarRoteiroOptions): string {
  const obj = valor && typeof valor === 'object' ? (valor as Record<string, unknown>) : null;
  if (!obj) return '';

  const limiteHoteis = 3;
  const limiteAtracoes = 5;
  const limiteDicas = 3;
  const linhas: string[] = [];

  const destinosFallback = normalizarDestinosFallback(options?.destinosFallback);
  const destinoResposta = textoOuVazio(obj.destination ?? obj.destino);
  const destino = destinoResposta && !ehDestinoNaoInformado(destinoResposta) ? destinoResposta : '';

  if (destino) {
    linhas.push(`Destino: ${destino}`, '');
  } else if (destinosFallback.length > 0) {
    const rotulo = destinosFallback.length > 1 ? 'Destinos' : 'Destino';
    linhas.push(`${rotulo}: ${destinosFallback.join(', ')}`, '');
  }

  const hotelsRaw = Array.isArray(obj.hotels) ? obj.hotels : [];
  if (hotelsRaw.length > 0) {
    const hotels = hotelsRaw.slice(0, limiteHoteis);
    linhas.push('Hoteis sugeridos:');
    hotels.forEach((hotel, index) => {
      if (typeof hotel === 'string') {
        linhas.push(`- ${index + 1}. ${hotel}`);
        return;
      }

      const h = hotel && typeof hotel === 'object' ? (hotel as Record<string, unknown>) : {};
      const nome = textoOuVazio(h.name ?? h.nome) || `Hotel ${index + 1}`;
      const bairro = textoOuVazio(h.neighborhood ?? h.bairro);
      const faixa = textoOuVazio(h.price_range ?? h.faixa_preco);
      const extras = [bairro ? `bairro: ${bairro}` : '', faixa ? `faixa: ${faixa}` : ''].filter(Boolean).join(' | ');
      linhas.push(extras ? `- ${index + 1}. ${nome} (${extras})` : `- ${index + 1}. ${nome}`);
    });
    if (hotelsRaw.length > hotels.length) {
      linhas.push(`- +${hotelsRaw.length - hotels.length} hotel(is) nao exibido(s)`);
    }
    linhas.push('');
  }

  const itineraryRaw = Array.isArray(obj.itinerary) ? obj.itinerary : [];
  if (itineraryRaw.length > 0) {
    linhas.push('Roteiro dia a dia:');
    itineraryRaw.forEach((item, index) => {
      const dia = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      const numeroDia = textoOuVazio(dia.day ?? dia.dia) || String(index + 1);
      const dataDia = formatarDataRoteiro(dia.date ?? dia.data);
      const tituloDia = textoOuVazio(dia.title ?? dia.titulo);
      const cabecalho = [`Dia ${numeroDia}`, dataDia, tituloDia].filter(Boolean).join(' - ');
      linhas.push(`- ${cabecalho}`);

      const atividades = Array.isArray(dia.activities)
        ? dia.activities
        : Array.isArray(dia.atividades)
          ? (dia.atividades as unknown[])
          : [];

      atividades.forEach((atividade) => {
        if (typeof atividade === 'string') {
          linhas.push(`  - ${atividade}`);
          return;
        }

        const a = atividade && typeof atividade === 'object' ? (atividade as Record<string, unknown>) : {};
        const horario = textoOuVazio(a.time ?? a.horario);
        const nome = textoOuVazio(a.activity ?? a.atividade ?? a.name ?? a.nome);
        const detalhe = textoOuVazio(a.details ?? a.detalhes ?? a.descricao);
        const prefixo = horario ? `${horario} - ` : '';
        const textoAtividade = [prefixo + (nome || 'Atividade'), detalhe].filter(Boolean).join(': ');
        linhas.push(`  - ${textoAtividade}`);
      });
    });
    linhas.push('');
  }

  const atracoesRaw = Array.isArray(obj.attractions) ? obj.attractions : [];
  if (atracoesRaw.length > 0) {
    const atracoes = atracoesRaw.slice(0, limiteAtracoes);
    linhas.push('Atracoes:');
    atracoes.forEach((atracao, index) => {
      if (typeof atracao === 'string') {
        linhas.push(`- ${index + 1}. ${atracao}`);
        return;
      }

      const a = atracao && typeof atracao === 'object' ? (atracao as Record<string, unknown>) : {};
      const nome = textoOuVazio(a.name ?? a.nome) || `Atracao ${index + 1}`;
      const detalhe = textoOuVazio(a.description ?? a.descricao ?? a.tip);
      linhas.push(detalhe ? `- ${index + 1}. ${nome}: ${detalhe}` : `- ${index + 1}. ${nome}`);
    });
    if (atracoesRaw.length > atracoes.length) {
      linhas.push(`- +${atracoesRaw.length - atracoes.length} atracao(oes) nao exibida(s)`);
    }
    linhas.push('');
  }

  const tipsRaw = Array.isArray(obj.tips) ? obj.tips : [];
  if (tipsRaw.length > 0) {
    const tips = tipsRaw.slice(0, limiteDicas);
    linhas.push('Dicas:');
    tips.forEach((dica, index) => {
      if (typeof dica === 'string') {
        linhas.push(`- ${index + 1}. ${dica}`);
        return;
      }

      const d = dica && typeof dica === 'object' ? (dica as Record<string, unknown>) : {};
      const titulo = textoOuVazio(d.title ?? d.titulo ?? d.category ?? d.categoria);
      const conteudo = textoOuVazio(d.content ?? d.conteudo ?? d.description ?? d.descricao);
      const textoDica = [titulo, conteudo].filter(Boolean).join(': ');
      linhas.push(`- ${index + 1}. ${textoDica || 'Dica'}`);
    });
    if (tipsRaw.length > tips.length) {
      linhas.push(`- +${tipsRaw.length - tips.length} dica(s) nao exibida(s)`);
    }
  }

  return linhas.join('\n').trim();
}

