let cart = [];
let deliveryFee = 0;
let paymentFee = 0;
let fidelidadeDesconto = 0;
let fidelidadePontosUsar = 0;
let fidelidadeSaldoPontos = 0;

let pendingMeatItem = null;
let pendingPromoPizza = null;
let pendingPizzaHalfItem = null;

const WHATSAPP_PHONE = "5595991249451";

// ===== ELEMENTOS GERAIS =====
const abrirCarrinhoBtn = document.getElementById("abrir-carrinho");
const fecharCarrinhoBtn = document.getElementById("fechar-carrinho");
const painelCarrinho = document.getElementById("painel-carrinho");

const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");

const finalizarBtn = document.getElementById("finalizar-btn");
const modalFinalizar = document.getElementById("modal-finalizar");
const cancelarModalBtn = document.getElementById("cancelar-modal");
const enviarPedidoBtn = document.getElementById("enviar-pedido");

// ===== ENTREGA / RETIRADA / LOCAL =====
const orderTypeSelect = document.getElementById("order-type");
const deliveryFields = document.getElementById("delivery-fields");
const bairroSelect = document.getElementById("delivery-neighborhood");
const taxaBox = document.getElementById("delivery-fee-box");
const taxaValue = document.getElementById("delivery-fee-value");
const deliveryAddress = document.getElementById("delivery-address");

// ===== PAGAMENTO =====
const paymentMethodSelect = document.getElementById("payment-method");
const paymentFeeBox = document.getElementById("payment-fee-box");
const paymentFeeValue = document.getElementById("payment-fee-value");
const changeWrapper = document.getElementById("change-wrapper");
const needsChangeSelect = document.getElementById("needs-change");
const changeAmountInput = document.getElementById("change-amount");

// ===== MODAL CARNE =====
const modalCarne = document.getElementById("modal-carne");
const meatItemName = document.getElementById("meat-item-name");
const chooseCaseiraBtn = document.getElementById("choose-caseira");
const chooseHamburguerBtn = document.getElementById("choose-hamburguer");
const cancelarCarneBtn = document.getElementById("cancelar-carne");

// ===== MODAL PROMOÇÃO PIZZA =====
const modalPromoPizza = document.getElementById("modal-promo-pizza");
const promoPizzaFlavor = document.getElementById("promo-pizza-flavor");
const confirmarPromoPizzaBtn = document.getElementById("confirmar-promo-pizza");
const cancelarPromoPizzaBtn = document.getElementById("cancelar-promo-pizza");

// ===== MODAL PIZZA METADE =====
const modalPizzaMetade = document.getElementById("modal-pizza-metade");
const pizzaSaborBase = document.getElementById("pizza-sabor-base");
const pizzaMode = document.getElementById("pizza-mode");
const pizzaSegundoSaborBox = document.getElementById("pizza-segundo-sabor-box");
const pizzaSegundoSabor = document.getElementById("pizza-segundo-sabor");
const cancelarPizzaMetadeBtn = document.getElementById("cancelar-pizza-metade");
const confirmarPizzaMetadeBtn = document.getElementById("confirmar-pizza-metade");

// ===== CAMPOS DO CLIENTE =====
const customerNameInput = document.getElementById("customer-name");
const customerPhoneInput = document.getElementById("customer-phone");
const customerCpfInput = document.getElementById("customer-cpf");
const observationsInput = document.getElementById("observations");

// ===== FIDELIDADE =====
const fidelidadeSaldoBox = document.getElementById("fidelidade-saldo-box");
const fidelidadeSaldoTexto = document.getElementById("fidelidade-saldo-texto");
const fidelidadePontosUsarInput = document.getElementById("fidelidade-pontos-usar");
const fidelidadeDescontoBox = document.getElementById("fidelidade-desconto-box");
const fidelidadeDescontoValor = document.getElementById("fidelidade-desconto-valor");
const fidelidadeHistoricoBox = document.getElementById("fidelidade-historico-box");
const fidelidadeHistoricoTexto = document.getElementById("fidelidade-historico-texto");

// ===== EVENTO GLOBAL DOS BOTÕES ADICIONAR =====
document.addEventListener("click", function (event) {
  const btn = event.target.closest(".btn-add");
  if (!btn) return;

  const name = btn.dataset.name || "";
  const price = Number(btn.dataset.price || 0);
  const requiresMeat = btn.dataset.requiresMeat === "true";
  const isPromoPizza = btn.dataset.promoPizza === "true";
  const isPizza = btn.dataset.isPizza === "true";

  if (requiresMeat) {
    pendingMeatItem = { name, price };
    if (meatItemName) meatItemName.textContent = name;
    if (modalCarne) modalCarne.classList.remove("escondido");
    return;
  }

  if (isPromoPizza) {
    pendingPromoPizza = { name, price };
    if (promoPizzaFlavor) promoPizzaFlavor.value = "";
    if (modalPromoPizza) modalPromoPizza.classList.remove("escondido");
    return;
  }

  if (isPizza) {
    pendingPizzaHalfItem = { name, price };
    if (pizzaSaborBase) pizzaSaborBase.textContent = name;
    if (pizzaMode) pizzaMode.value = "inteira";
    if (pizzaSegundoSabor) pizzaSegundoSabor.value = "";
    if (pizzaSegundoSaborBox) pizzaSegundoSaborBox.classList.add("escondido");
    if (modalPizzaMetade) modalPizzaMetade.classList.remove("escondido");
    return;
  }

  addToCart(name, price);
});

// ===== CARRINHO =====
function addToCart(name, price) {
  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      name,
      price,
      qty: 1,
    });
  }

  updateCartUI();
}

function increaseQty(index) {
  if (!cart[index]) return;
  cart[index].qty += 1;
  updateCartUI();
}

function decreaseQty(index) {
  if (!cart[index]) return;
  cart[index].qty -= 1;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCartUI();
}

function removeItem(index) {
  if (!cart[index]) return;
  cart.splice(index, 1);
  updateCartUI();
}

function clearCart() {
  cart = [];
  updateCartUI();
}

function getItemsSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getTotalPrice() {
  const bruto = getItemsSubtotal() + deliveryFee + paymentFee;
  return Math.max(0, bruto - fidelidadeDesconto);
}

function getTotalBruto() {
  return getItemsSubtotal() + deliveryFee + paymentFee;
}

function resetarFidelidadeUI() {
  fidelidadeDesconto = 0;
  fidelidadePontosUsar = 0;
  fidelidadeSaldoPontos = 0;

  if (customerCpfInput) customerCpfInput.value = "";
  if (fidelidadePontosUsarInput) fidelidadePontosUsarInput.value = "";
  if (fidelidadeSaldoBox) fidelidadeSaldoBox.classList.add("escondido");
  if (fidelidadePontosUsarInput) fidelidadePontosUsarInput.classList.add("escondido");
  if (fidelidadeDescontoBox) fidelidadeDescontoBox.classList.add("escondido");
  if (fidelidadeHistoricoBox) fidelidadeHistoricoBox.classList.add("escondido");
  if (fidelidadeDescontoValor) fidelidadeDescontoValor.textContent = "0.00";
  updateCartUI();
}

function formatarCpfVisual(cpf) {
  const numeros = Fidelidade.normalizarCpf(cpf);
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function atualizarDescontoFidelidade(mostrarAlerta) {
  fidelidadeDesconto = 0;
  fidelidadePontosUsar = 0;

  if (fidelidadeDescontoBox) fidelidadeDescontoBox.classList.add("escondido");
  if (fidelidadeDescontoValor) fidelidadeDescontoValor.textContent = "0.00";

  if (!fidelidadePontosUsarInput || !customerCpfInput) {
    return;
  }

  const pontosInformados = Number(fidelidadePontosUsarInput.value || 0);
  if (!pontosInformados) {
    return;
  }

  const validacao = Fidelidade.validarResgate(
    pontosInformados,
    fidelidadeSaldoPontos,
    getTotalBruto()
  );

  if (!validacao.valido) {
    if (mostrarAlerta) {
      alert(validacao.erro);
    }
    fidelidadePontosUsarInput.value = "";
    return;
  }

  fidelidadePontosUsar = validacao.pontosUtilizados;
  fidelidadeDesconto = validacao.desconto;

  if (fidelidadeDescontoBox) fidelidadeDescontoBox.classList.remove("escondido");
  if (fidelidadeDescontoValor) {
    fidelidadeDescontoValor.textContent = fidelidadeDesconto.toFixed(2);
  }
}

async function carregarFidelidadePorCpf() {
  if (!customerCpfInput) return;

  const cpf = customerCpfInput.value.trim();
  if (!cpf) {
    resetarFidelidadeUI();
    return;
  }

  const validacao = Fidelidade.validarCpf(cpf);
  if (!validacao.valido) {
    alert(validacao.erro);
    return;
  }

  customerCpfInput.value = formatarCpfVisual(validacao.cpf);

  try {
    const nome = customerNameInput ? customerNameInput.value.trim() : "";
    const saldo = await Fidelidade.consultarSaldo(validacao.cpf, nome);
    fidelidadeSaldoPontos = saldo.pontos;

    if (fidelidadeSaldoBox) fidelidadeSaldoBox.classList.remove("escondido");
    if (fidelidadeSaldoTexto) {
      if (saldo.pontos === 0) {
        fidelidadeSaldoTexto.textContent =
          "Fidelidade: 0 pontos. Você ganhará 1 ponto a cada R$1,00 gasto neste pedido.";
      } else {
        fidelidadeSaldoTexto.textContent =
          "Fidelidade: " +
          saldo.pontos +
          " pontos (R$ " +
          saldo.valorDisponivel.toFixed(2) +
          " de desconto disponível)";
      }
    }

    if (fidelidadePontosUsarInput) {
      fidelidadePontosUsarInput.classList.remove("escondido");
    }

    const historico = await Fidelidade.consultarHistorico(validacao.cpf, 5);
    if (historico.length > 0 && fidelidadeHistoricoBox && fidelidadeHistoricoTexto) {
      const linhas = historico.map(function (item) {
        const data = new Date(item.criado_em).toLocaleString("pt-BR");
        const sinal = item.tipo === "ganho" ? "+" : "-";
        return data + " | " + sinal + item.pontos + " pts | " + item.descricao;
      });

      fidelidadeHistoricoTexto.innerHTML =
        "Últimas movimentações:<br>" + linhas.join("<br>");
      fidelidadeHistoricoBox.classList.remove("escondido");
    } else if (fidelidadeHistoricoBox) {
      fidelidadeHistoricoBox.classList.add("escondido");
    }

  } catch (erro) {
    alert("Fidelidade: " + erro.message);
  }
}

function updateCartUI() {
  if (!cartItems || !cartCount || !cartTotal) return;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Carrinho vazio.</p>";
    cartCount.textContent = "0";
    cartTotal.textContent = (deliveryFee + paymentFee).toFixed(2);
    return;
  }

  cart.forEach((item, index) => {
    const subtotal = (item.price * item.qty).toFixed(2);

    const itemDiv = document.createElement("div");
    itemDiv.className = "item-carrinho";

    itemDiv.innerHTML = `
      <strong>${item.name}</strong>
      <small>${item.price === 0 ? "Valor a confirmar" : "Preço unitário: R$ " + item.price.toFixed(2)}</small>
      <div class="acoes-carrinho">
        <button onclick="decreaseQty(${index})" type="button">-</button>
        <span>${item.qty}</span>
        <button onclick="increaseQty(${index})" type="button">+</button>
        <button onclick="removeItem(${index})" class="remover-btn" type="button">Remover</button>
      </div>
      <small>${item.price === 0 ? "Subtotal será confirmado no WhatsApp" : "Subtotal: R$ " + subtotal}</small>
    `;

    cartItems.appendChild(itemDiv);
  });

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Limpar carrinho";
  clearBtn.className = "limpar-carrinho-btn";
  clearBtn.type = "button";
  clearBtn.onclick = clearCart;
  cartItems.appendChild(clearBtn);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  atualizarDescontoFidelidade(false);

  cartCount.textContent = String(totalItems);
  cartTotal.textContent = getTotalPrice().toFixed(2);
}

// ===== ABRIR / FECHAR CARRINHO =====
if (abrirCarrinhoBtn) {
  abrirCarrinhoBtn.addEventListener("click", () => {
    painelCarrinho.classList.remove("escondido");
  });
}

if (fecharCarrinhoBtn) {
  fecharCarrinhoBtn.addEventListener("click", () => {
    painelCarrinho.classList.add("escondido");
  });
}

// ===== MODAL FINALIZAR =====
if (finalizarBtn) {
  finalizarBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }
    resetarFidelidadeUI();
    modalFinalizar.classList.remove("escondido");
  });
}

if (cancelarModalBtn) {
  cancelarModalBtn.addEventListener("click", () => {
    modalFinalizar.classList.add("escondido");
    resetarFidelidadeUI();
  });
}

if (customerCpfInput) {
  customerCpfInput.addEventListener("blur", () => {
    carregarFidelidadePorCpf();
  });
}

if (fidelidadePontosUsarInput) {
  fidelidadePontosUsarInput.addEventListener("change", () => {
    atualizarDescontoFidelidade(true);
    updateCartUI();
  });

  fidelidadePontosUsarInput.addEventListener("blur", () => {
    atualizarDescontoFidelidade(true);
    updateCartUI();
  });
}

// ===== ENTREGA / RETIRADA / LOCAL =====
if (orderTypeSelect) {
  orderTypeSelect.addEventListener("change", () => {
    const type = orderTypeSelect.value;

    deliveryFee = 0;

    if (bairroSelect) bairroSelect.value = "";
    if (deliveryAddress) deliveryAddress.value = "";

    if (taxaValue) taxaValue.textContent = "0.00";
    if (taxaBox) taxaBox.classList.add("escondido");

    if (type === "entrega") {
      if (deliveryFields) deliveryFields.classList.remove("escondido");
    } else {
      if (deliveryFields) deliveryFields.classList.add("escondido");
    }

    updateCartUI();
  });
}

if (bairroSelect) {
  bairroSelect.addEventListener("change", () => {
    if (!orderTypeSelect || orderTypeSelect.value !== "entrega") {
      deliveryFee = 0;
      if (taxaValue) taxaValue.textContent = "0.00";
      if (taxaBox) taxaBox.classList.add("escondido");
      updateCartUI();
      return;
    }

    const selectedOption = bairroSelect.options[bairroSelect.selectedIndex];
    deliveryFee = Number(selectedOption.dataset.fee || 0);

    if (bairroSelect.value) {
      if (taxaBox) taxaBox.classList.remove("escondido");
      if (taxaValue) taxaValue.textContent = deliveryFee.toFixed(2);
    } else {
      if (taxaBox) taxaBox.classList.add("escondido");
      if (taxaValue) taxaValue.textContent = "0.00";
    }

    updateCartUI();
  });
}

// ===== PAGAMENTO =====
if (paymentMethodSelect) {
  paymentMethodSelect.addEventListener("change", () => {
    paymentFee = 0;

    if (paymentFeeBox) paymentFeeBox.classList.add("escondido");
    if (changeWrapper) changeWrapper.classList.add("escondido");

    if (needsChangeSelect) needsChangeSelect.value = "";
    if (changeAmountInput) {
      changeAmountInput.value = "";
      changeAmountInput.classList.add("escondido");
    }

    if (paymentMethodSelect.value === "cartao_credito") {
      paymentFee = 2.0;
      if (paymentFeeBox) paymentFeeBox.classList.remove("escondido");
      if (paymentFeeValue) paymentFeeValue.textContent = paymentFee.toFixed(2);
    }

    if (paymentMethodSelect.value === "cartao_debito") {
      paymentFee = 1.5;
      if (paymentFeeBox) paymentFeeBox.classList.remove("escondido");
      if (paymentFeeValue) paymentFeeValue.textContent = paymentFee.toFixed(2);
    }

    if (paymentMethodSelect.value === "dinheiro") {
      if (changeWrapper) changeWrapper.classList.remove("escondido");
    }

    updateCartUI();
  });
}

if (needsChangeSelect) {
  needsChangeSelect.addEventListener("change", () => {
    if (!changeAmountInput) return;

    if (needsChangeSelect.value === "sim") {
      changeAmountInput.classList.remove("escondido");
    } else {
      changeAmountInput.classList.add("escondido");
      changeAmountInput.value = "";
    }
  });
}

// ===== MODAL CARNE =====
if (chooseCaseiraBtn) {
  chooseCaseiraBtn.addEventListener("click", () => {
    if (!pendingMeatItem) return;

    addToCart(`${pendingMeatItem.name} - Carne caseira`, pendingMeatItem.price);
    pendingMeatItem = null;
    modalCarne.classList.add("escondido");
  });
}

if (chooseHamburguerBtn) {
  chooseHamburguerBtn.addEventListener("click", () => {
    if (!pendingMeatItem) return;

    addToCart(`${pendingMeatItem.name} - Carne de hambúrguer`, pendingMeatItem.price);
    pendingMeatItem = null;
    modalCarne.classList.add("escondido");
  });
}

if (cancelarCarneBtn) {
  cancelarCarneBtn.addEventListener("click", () => {
    pendingMeatItem = null;
    modalCarne.classList.add("escondido");
  });
}

// ===== MODAL PROMO PIZZA =====
if (confirmarPromoPizzaBtn) {
  confirmarPromoPizzaBtn.addEventListener("click", () => {
    if (!pendingPromoPizza) return;

    const sabor = promoPizzaFlavor ? promoPizzaFlavor.value.trim() : "";

    if (!sabor) {
      alert("Escolha o sabor da pizza.");
      return;
    }

    addToCart(`${pendingPromoPizza.name} (${sabor})`, pendingPromoPizza.price);
    pendingPromoPizza = null;
    modalPromoPizza.classList.add("escondido");
  });
}

if (cancelarPromoPizzaBtn) {
  cancelarPromoPizzaBtn.addEventListener("click", () => {
    pendingPromoPizza = null;
    modalPromoPizza.classList.add("escondido");
  });
}

// ===== MODAL PIZZA METADE =====
if (pizzaMode) {
  pizzaMode.addEventListener("change", () => {
    if (pizzaMode.value === "metade") {
      pizzaSegundoSaborBox.classList.remove("escondido");
    } else {
      pizzaSegundoSaborBox.classList.add("escondido");
      pizzaSegundoSabor.value = "";
    }
  });
}

if (cancelarPizzaMetadeBtn) {
  cancelarPizzaMetadeBtn.addEventListener("click", () => {
    pendingPizzaHalfItem = null;
    modalPizzaMetade.classList.add("escondido");
  });
}

if (confirmarPizzaMetadeBtn) {
  confirmarPizzaMetadeBtn.addEventListener("click", () => {
    if (!pendingPizzaHalfItem) return;

    const modo = pizzaMode ? pizzaMode.value : "inteira";

    if (modo === "inteira") {
      addToCart(pendingPizzaHalfItem.name, pendingPizzaHalfItem.price);
      pendingPizzaHalfItem = null;
      modalPizzaMetade.classList.add("escondido");
      return;
    }

    const outroSabor = pizzaSegundoSabor ? pizzaSegundoSabor.value.trim() : "";

    if (!outroSabor) {
      alert("Escolha o outro sabor.");
      return;
    }

    const saborBase = pendingPizzaHalfItem.name.replace("Pizza ", "").trim();

    if (outroSabor.toLowerCase() === saborBase.toLowerCase()) {
      alert("Escolha um sabor diferente para a outra metade.");
      return;
    }

    addToCart(`Pizza ${saborBase} / Meio ${outroSabor}`, pendingPizzaHalfItem.price);
    pendingPizzaHalfItem = null;
    modalPizzaMetade.classList.add("escondido");
  });
}

// ===== ENVIAR PEDIDO =====
if (enviarPedidoBtn) {
  enviarPedidoBtn.addEventListener("click", async () => {
    const customerName = customerNameInput ? customerNameInput.value.trim() : "";
    const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    const customerCpf = customerCpfInput ? customerCpfInput.value.trim() : "";
    const orderType = orderTypeSelect ? orderTypeSelect.value : "";
    const neighborhood = bairroSelect ? bairroSelect.value.trim() : "";
    const address = deliveryAddress ? deliveryAddress.value.trim() : "";
    const observations = observationsInput ? observationsInput.value.trim() : "";

    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : "";
    const needsChange = needsChangeSelect ? needsChangeSelect.value : "";
    const changeAmount = changeAmountInput ? changeAmountInput.value.trim() : "";

    if (!customerName || !customerPhone || !orderType) {
      alert("Preencha nome, telefone e como deseja receber.");
      return;
    }

    if (orderType === "entrega" && (!neighborhood || !address)) {
      alert("Preencha bairro e endereço para entrega.");
      return;
    }

    if (!paymentMethod) {
      alert("Selecione a forma de pagamento.");
      return;
    }

    if (paymentMethod === "dinheiro" && !needsChange) {
      alert("Informe se vai precisar de troco.");
      return;
    }

    if (paymentMethod === "dinheiro" && needsChange === "sim" && !changeAmount) {
      alert("Informe o valor do troco.");
      return;
    }

    const totalBruto = getTotalBruto();
    const pontosInformados = fidelidadePontosUsarInput
      ? Number(fidelidadePontosUsarInput.value || 0)
      : 0;

    if (pontosInformados > 0 && !customerCpf) {
      alert("Informe o CPF para usar pontos de fidelidade.");
      return;
    }

    if (customerCpf) {
      const validacaoCpf = Fidelidade.validarCpf(customerCpf);
      if (!validacaoCpf.valido) {
        alert(validacaoCpf.erro);
        return;
      }

      try {
        const saldo = await Fidelidade.consultarSaldo(validacaoCpf.cpf, customerName);
        fidelidadeSaldoPontos = saldo.pontos;
      } catch (erro) {
        alert("Fidelidade: " + erro.message);
        return;
      }
    }

    atualizarDescontoFidelidade(true);
    updateCartUI();

    if (pontosInformados > 0) {
      const validacaoResgate = Fidelidade.validarResgate(
        pontosInformados,
        fidelidadeSaldoPontos,
        totalBruto
      );

      if (!validacaoResgate.valido) {
        alert(validacaoResgate.erro);
        return;
      }
    }

    let orderTypeLabel = "";
    if (orderType === "entrega") orderTypeLabel = "Entrega";
    if (orderType === "retirada") orderTypeLabel = "Retirada";
    if (orderType === "local") orderTypeLabel = "Consumir no local";

    let paymentLabel = "";
    if (paymentMethod === "pix") paymentLabel = "Pix";
    if (paymentMethod === "dinheiro") paymentLabel = "Dinheiro";
    if (paymentMethod === "cartao_credito") paymentLabel = "Cartão de crédito";
    if (paymentMethod === "cartao_debito") paymentLabel = "Cartão de débito";

    let message = "📦 *NOVO PEDIDO - BURDOG*\n\n";
    message += "👤 *Nome:* " + customerName + "\n";
    message += "📞 *Telefone:* " + customerPhone + "\n";

    if (customerCpf) {
      message += "🪪 *CPF:* " + customerCpf + "\n";
    }

    message += "📦 *Tipo:* " + orderTypeLabel + "\n";

    if (orderType === "entrega") {
      message += "📍 *Bairro:* " + neighborhood + "\n";
      message += "🏠 *Endereço:* " + address + "\n";
      message += "🚚 *Taxa de entrega:* R$ " + deliveryFee.toFixed(2) + "\n";
    }

    message += "💳 *Pagamento:* " + paymentLabel + "\n";

    if (paymentMethod === "cartao_credito" || paymentMethod === "cartao_debito") {
      message += "🏦 *Taxa da maquininha:* R$ " + paymentFee.toFixed(2) + "\n";
    }

    if (paymentMethod === "dinheiro") {
      if (needsChange === "sim") {
        message += "💵 *Troco:* Sim, para R$ " + Number(changeAmount).toFixed(2) + "\n";
      } else {
        message += "💵 *Troco:* Não\n";
      }
    }

    message += "\n🍔 *ITENS:*\n";

    const hasConsultItems = cart.some((item) => item.price === 0);

    cart.forEach((item) => {
      if (item.price === 0) {
        message += "- " + item.qty + "x " + item.name + " - valor a confirmar\n";
      } else {
        const subtotal = (item.price * item.qty).toFixed(2);
        message += "- " + item.qty + "x " + item.name + " - R$ " + subtotal + "\n";
      }
    });

    const itemsTotal = getItemsSubtotal();
    const total = getTotalPrice();

    message += "\n💰 *Resumo:*\n";
    message += "Subtotal: R$ " + itemsTotal.toFixed(2) + "\n";

    if (hasConsultItems) {
      message += "⚠️ Itens com valor a confirmar\n";
    }

    if (orderType === "entrega") {
      message += "Taxa de entrega: R$ " + deliveryFee.toFixed(2) + "\n";
    }

    if (paymentFee > 0) {
      message += "Taxa da maquininha: R$ " + paymentFee.toFixed(2) + "\n";
    }

    if (fidelidadeDesconto > 0) {
      message +=
        "Desconto fidelidade (" +
        fidelidadePontosUsar +
        " pts): R$ " +
        fidelidadeDesconto.toFixed(2) +
        "\n";
    }

    message += "*TOTAL: R$ " + total.toFixed(2) + "*\n";

    if (observations) {
      message += "\n📝 *Observações:* " + observations + "\n";
    }

    enviarPedidoBtn.disabled = true;

    try {
      if (customerCpf && fidelidadePontosUsar > 0) {
        await Fidelidade.resgatarPontos(
          customerCpf,
          fidelidadePontosUsar,
          totalBruto,
          customerName
        );
      }

      const url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + encodeURIComponent(message);
      window.open(url, "_blank");

      if (customerCpf && total > 0) {
        const resultado = await Fidelidade.registrarVenda(customerCpf, total, customerName);
        if (resultado.pontosGanhos > 0) {
          alert(
            "Pedido enviado! Você ganhou " +
              resultado.pontosGanhos +
              " pontos. Saldo atual: " +
              resultado.saldoAtual +
              " pontos."
          );
        }
      }

      modalFinalizar.classList.add("escondido");
      resetarFidelidadeUI();
      clearCart();
    } catch (erro) {
      alert("Erro no programa de fidelidade: " + erro.message);
    } finally {
      enviarPedidoBtn.disabled = false;
    }
  });
}

// ===== FUNÇÕES GLOBAIS DOS BOTÕES INLINE =====
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.removeItem = removeItem;

// ===== INICIAR =====
updateCartUI();