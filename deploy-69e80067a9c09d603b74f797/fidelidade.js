/**
 * Sistema de Fidelidade - Burdog
 * Regras: R$1 = 1 ponto | 1 ponto = R$0,03 | máx. 20% de desconto
 */

const FIDELIDADE_CONFIG = {
  SUPABASE_URL: "https://kbipcoltuputqtbxnzhz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaXBjb2x0dXB1dHF0Ynhuemh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTk2ODgsImV4cCI6MjA5NjI3NTY4OH0.DMBAftBsf8hpgVoTAW7Cfp6oE00LoNQRU9QamzjX2coE",
  VALOR_POR_PONTO: 0.03,
  DESCONTO_MAXIMO_PERCENTUAL: 0.2,
};

const Fidelidade = (function () {
  let supabaseClient = null;

  function normalizarSupabaseUrl(url) {
    let limpa = String(url || "").trim();

    if (limpa.startsWith("Shttps://")) {
      limpa = limpa.replace(/^S/, "");
    }

    return limpa;
  }

  function validarConfiguracao() {
    const url = normalizarSupabaseUrl(FIDELIDADE_CONFIG.SUPABASE_URL);
    const chave = String(FIDELIDADE_CONFIG.SUPABASE_ANON_KEY || "").trim();

    if (!url || url === "SUA_URL_DO_SUPABASE") {
      return { valida: false, erro: "Configure a URL do Supabase em fidelidade.js" };
    }

    if (!chave || chave === "SUA_CHAVE_ANON_DO_SUPABASE") {
      return { valida: false, erro: "Configure a chave anon do Supabase em fidelidade.js" };
    }

    if (!/^https?:\/\/.+/i.test(url)) {
      return {
        valida: false,
        erro: "URL do Supabase inválida. Deve começar com https:// (ex: https://seu-projeto.supabase.co)",
      };
    }

    return { valida: true, url, chave };
  }

  function getClient() {
    if (!window.supabase) {
      throw new Error("Biblioteca Supabase não carregada.");
    }

    if (!supabaseClient) {
      const config = validarConfiguracao();
      if (!config.valida) {
        throw new Error(config.erro);
      }

      supabaseClient = window.supabase.createClient(config.url, config.chave);
    }

    return supabaseClient;
  }

  function normalizarCpf(cpf) {
    return String(cpf || "").replace(/\D/g, "");
  }

  function validarCpf(cpf) {
    const numeros = normalizarCpf(cpf);

    if (numeros.length !== 11) {
      return { valido: false, erro: "CPF deve conter 11 dígitos." };
    }

    if (/^(\d)\1{10}$/.test(numeros)) {
      return { valido: false, erro: "CPF inválido." };
    }

    return { valido: true, cpf: numeros };
  }

  function calcularValorDesconto(pontos) {
    return Number((pontos * FIDELIDADE_CONFIG.VALOR_POR_PONTO).toFixed(2));
  }

  function calcularPontosGanhos(valorCompra) {
    return Math.floor(Number(valorCompra) || 0);
  }

  function calcularDescontoMaximo(valorCompra) {
    return Number(
      (Number(valorCompra) * FIDELIDADE_CONFIG.DESCONTO_MAXIMO_PERCENTUAL).toFixed(2)
    );
  }

  function calcularPontosMaximosPermitidos(valorCompra, saldoPontos) {
    const descontoMaximo = calcularDescontoMaximo(valorCompra);
    const pontosPorLimite = Math.floor(descontoMaximo / FIDELIDADE_CONFIG.VALOR_POR_PONTO);
    return Math.min(saldoPontos, pontosPorLimite);
  }

  async function buscarOuCriarCliente(cpf, nome) {
    const validacao = validarCpf(cpf);
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    const cpfLimpo = validacao.cpf;
    const db = getClient();

    const { data: existente, error: erroBusca } = await db
      .from("clientes")
      .select("cpf, nome, pontos, criado_em")
      .eq("cpf", cpfLimpo)
      .maybeSingle();

    if (erroBusca) {
      throw new Error("Erro ao buscar cliente: " + erroBusca.message);
    }

    if (existente) {
      if (nome && nome.trim() && existente.nome !== nome.trim()) {
        const { data: atualizado, error: erroUpdate } = await db
          .from("clientes")
          .update({ nome: nome.trim() })
          .eq("cpf", cpfLimpo)
          .select("cpf, nome, pontos, criado_em")
          .single();

        if (erroUpdate) {
          throw new Error("Erro ao atualizar nome do cliente: " + erroUpdate.message);
        }

        return atualizado;
      }

      return existente;
    }

    const { data: novo, error: erroInsert } = await db
      .from("clientes")
      .insert({
        cpf: cpfLimpo,
        nome: nome ? nome.trim() : "",
        pontos: 0,
      })
      .select("cpf, nome, pontos, criado_em")
      .single();

    if (erroInsert) {
      throw new Error("Erro ao cadastrar cliente: " + erroInsert.message);
    }

    return novo;
  }

  async function consultarSaldo(cpf, nome) {
    const cliente = await buscarOuCriarCliente(cpf, nome);

    return {
      cpf: cliente.cpf,
      pontos: cliente.pontos,
      valorDisponivel: calcularValorDesconto(cliente.pontos),
      nome: cliente.nome,
    };
  }

  async function registrarMovimentacao(cpf, tipo, pontos, valorReais, descricao) {
    const db = getClient();

    const { error } = await db.from("movimentacoes_pontos").insert({
      cpf,
      tipo,
      pontos,
      valor_reais: valorReais,
      descricao,
    });

    if (error) {
      throw new Error("Erro ao registrar movimentação: " + error.message);
    }
  }

  async function atualizarPontosCliente(cpf, novosPontos) {
    const db = getClient();

    const { data, error } = await db
      .from("clientes")
      .update({ pontos: novosPontos })
      .eq("cpf", cpf)
      .select("cpf, nome, pontos, criado_em")
      .single();

    if (error) {
      throw new Error("Erro ao atualizar pontos: " + error.message);
    }

    return data;
  }

  async function registrarVenda(cpf, valorCompra, nome) {
    const validacao = validarCpf(cpf);
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    const valor = Number(valorCompra);
    if (!valor || valor <= 0) {
      throw new Error("Valor da compra deve ser maior que zero.");
    }

    const pontosGanhos = calcularPontosGanhos(valor);
    if (pontosGanhos <= 0) {
      return { cpf: validacao.cpf, pontosGanhos: 0, saldoAtual: 0 };
    }

    const cliente = await buscarOuCriarCliente(validacao.cpf, nome);
    const novoSaldo = cliente.pontos + pontosGanhos;

    const clienteAtualizado = await atualizarPontosCliente(validacao.cpf, novoSaldo);

    await registrarMovimentacao(
      validacao.cpf,
      "ganho",
      pontosGanhos,
      valor,
      "Pontos ganhos na compra de R$ " + valor.toFixed(2)
    );

    return {
      cpf: clienteAtualizado.cpf,
      pontosGanhos,
      saldoAtual: clienteAtualizado.pontos,
    };
  }

  function validarResgate(pontosUtilizados, saldoPontos, valorCompra) {
    const pontos = Number(pontosUtilizados);

    if (!pontos || pontos < 1 || !Number.isInteger(pontos)) {
      return { valido: false, erro: "Informe pelo menos 1 ponto para resgatar." };
    }

    if (pontos > saldoPontos) {
      return { valido: false, erro: "Saldo de pontos insuficiente." };
    }

    const desconto = calcularValorDesconto(pontos);
    const descontoMaximo = calcularDescontoMaximo(valorCompra);

    if (desconto > descontoMaximo) {
      const pontosMaximos = calcularPontosMaximosPermitidos(valorCompra, saldoPontos);
      return {
        valido: false,
        erro:
          "Desconto máximo permitido é 20% da compra (R$ " +
          descontoMaximo.toFixed(2) +
          "). Máximo de pontos: " +
          pontosMaximos +
          ".",
      };
    }

    return {
      valido: true,
      desconto,
      descontoMaximo,
      pontosUtilizados: pontos,
    };
  }

  async function resgatarPontos(cpf, pontosUtilizados, valorCompra, nome) {
    const validacaoCpf = validarCpf(cpf);
    if (!validacaoCpf.valido) {
      throw new Error(validacaoCpf.erro);
    }

    const valor = Number(valorCompra);
    if (!valor || valor <= 0) {
      throw new Error("Valor da compra deve ser maior que zero.");
    }

    const cliente = await buscarOuCriarCliente(validacaoCpf.cpf, nome);
    const validacaoResgate = validarResgate(pontosUtilizados, cliente.pontos, valor);

    if (!validacaoResgate.valido) {
      throw new Error(validacaoResgate.erro);
    }

    const novoSaldo = cliente.pontos - validacaoResgate.pontosUtilizados;
    const clienteAtualizado = await atualizarPontosCliente(validacaoCpf.cpf, novoSaldo);

    await registrarMovimentacao(
      validacaoCpf.cpf,
      "resgate",
      validacaoResgate.pontosUtilizados,
      validacaoResgate.desconto,
      "Resgate de " +
        validacaoResgate.pontosUtilizados +
        " pontos (R$ " +
        validacaoResgate.desconto.toFixed(2) +
        " de desconto)"
    );

    return {
      cpf: clienteAtualizado.cpf,
      pontosUtilizados: validacaoResgate.pontosUtilizados,
      desconto: validacaoResgate.desconto,
      saldoAtual: clienteAtualizado.pontos,
    };
  }

  async function consultarHistorico(cpf, limite) {
    const validacao = validarCpf(cpf);
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    const db = getClient();
    const max = limite || 10;

    const { data, error } = await db
      .from("movimentacoes_pontos")
      .select("id, cpf, tipo, pontos, valor_reais, descricao, criado_em")
      .eq("cpf", validacao.cpf)
      .order("criado_em", { ascending: false })
      .limit(max);

    if (error) {
      throw new Error("Erro ao consultar histórico: " + error.message);
    }

    return data || [];
  }

  return {
    normalizarCpf,
    validarCpf,
    calcularValorDesconto,
    calcularPontosGanhos,
    calcularDescontoMaximo,
    calcularPontosMaximosPermitidos,
    validarResgate,
    buscarOuCriarCliente,
    consultarSaldo,
    registrarVenda,
    resgatarPontos,
    consultarHistorico,
  };
})();

