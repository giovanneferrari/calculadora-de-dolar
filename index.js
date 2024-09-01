// Função para verificar se um dia é útil (segunda a sexta)
function isWeekday(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
}

// Função para formatar a data no formato "dd/mm/aaaa"
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

// Função para obter o histórico dos últimos 7 dias úteis para uma moeda específica
async function obterHistoricoMoeda(moeda) {
  const hoje = new Date();
  const historico = [];
  let diasUteisContados = 0;
  let dataAtual = new Date(hoje);

  // Retroceder até encontrar o último dia útil
  while (diasUteisContados < 7) {
    dataAtual.setDate(dataAtual.getDate() - 1);

    if (isWeekday(dataAtual)) {
      let formattedDate = `${String(dataAtual.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dataAtual.getDate()).padStart(2, "0")}-${String(
        dataAtual.getFullYear()
      )}`;

      let apiUrl;
      if (moeda === "USD") {
        apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27${formattedDate}%27&$top=100&$skip=0&$format=json&$select=cotacaoVenda`;
      } else if (moeda === "EUR") {
        apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda=%27EUR%27&@dataCotacao=%27${formattedDate}%27&$top=5&$skip=4&$format=json&$select=cotacaoVenda`;
      }

      let resposta = await fetch(apiUrl);
      let jsonData = await resposta.json();

      // Continuar retrocedendo até encontrar uma cotação válida
      while (jsonData.value.length === 0) {
        dataAtual.setDate(dataAtual.getDate() - 1);

        // Certifique-se de que ainda está no intervalo de dias úteis.
        while (!isWeekday(dataAtual)) {
          dataAtual.setDate(dataAtual.getDate() - 1);
        }

        formattedDate = `${String(dataAtual.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(dataAtual.getDate()).padStart(2, "0")}-${String(
          dataAtual.getFullYear()
        )}`;

        resposta = await fetch(apiUrl);
        jsonData = await resposta.json();
      }

      const taxaDeCambio = parseFloat(jsonData.value[0].cotacaoVenda);
      const dataCotacao = formatDate(dataAtual);
      historico.push({ data: dataCotacao, cotacao: taxaDeCambio });

      diasUteisContados++;
    }
  }

  return historico;
}

// Função para exibir o histórico das cotações em formato de tabela
function exibirHistorico(moeda) {
  obterHistoricoMoeda(moeda).then((historico) => {
    const historicoElement = document.getElementById("historico");

    // Limpar o conteúdo existente
    historicoElement.innerHTML = "";

    // Definir o símbolo da moeda
    const moedaSimbolo = moeda === "USD" ? "$" : "€";

    // Adicionar o título centralizado
    historicoElement.innerHTML += `
            <h4 style="text-align: center;">Histórico das Cotações (Últimos 7 Dias Úteis)</h4>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Cotação (${moedaSimbolo})</th>
                    </tr>
                </thead>
                <tbody>
                    ${historico
                      .map(
                        (entry) => `
                        <tr>
                            <td>${entry.data}</td>
                            <td>${moedaSimbolo} ${entry.cotacao.toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2, maximumFractionDigits: 4 }
                        )}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>`;
  });
}

// Função principal para converter a moeda
async function converterMoeda() {
  const valor = document.getElementById("valor").value;
  const conversionType = document.getElementById("conversionType").value;

  if (valor === "") {
    alert("Por favor, insira um valor.");
    return;
  }

  try {
    let today = new Date();

    // Retroceder até encontrar um dia útil
    while (!isWeekday(today)) {
      today.setDate(today.getDate() - 1);
    }

    let formattedDate = `${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate() + 1).padStart(2, "0")}-${String(
      today.getFullYear()
    )}`;

    let apiUrl;
    let moeda;
    if (conversionType === "BRLtoUSD" || conversionType === "USDtoBRL") {
      moeda = "USD";
      apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27${formattedDate}%27&$top=100&$skip=0&$format=json&$select=cotacaoVenda`;
    } else if (conversionType === "BRLtoEUR" || conversionType === "EURtoBRL") {
      moeda = "EUR";
      apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda=%27EUR%27&@dataCotacao=%27${formattedDate}%27&$top=5&$skip=4&$format=json&$select=cotacaoVenda`;
    }

    let response = await fetch(apiUrl);
    let jsonData = await response.json();

    // Continuar retrocedendo até encontrar uma cotação válida
    while (jsonData.value.length === 0) {
      today.setDate(today.getDate() - 1);

      // Certifique-se de que ainda está no intervalo de dias úteis.
      while (!isWeekday(today)) {
        today.setDate(today.getDate() - 1);
      }

      formattedDate = `${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(today.getDate()).padStart(2, "0")}-${String(
        today.getFullYear()
      )}`;

      if (moeda === "USD") {
        apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27${formattedDate}%27&$top=100&$skip=0&$format=json&$select=cotacaoVenda`;
      } else if (moeda === "EUR") {
        apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda=%27EUR%27&@dataCotacao=%27${formattedDate}%27&$top=5&$skip=4&$format=json&$select=cotacaoVenda`;
      }

      response = await fetch(apiUrl);
      jsonData = await response.json();
    }

    const taxaDeCambio = parseFloat(jsonData.value[0].cotacaoVenda);
    const dataCotacao = formatDate(today);

    let resultado;
    if (conversionType === "BRLtoUSD") {
      const valorEmDolar = (valor / taxaDeCambio).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      resultado = `R$ ${valor} equivale a $ ${valorEmDolar}`;
    } else if (conversionType === "USDtoBRL") {
      const valorEmReais = (valor * taxaDeCambio).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      resultado = `$ ${valor} equivale a R$ ${valorEmReais}`;
    } else if (conversionType === "BRLtoEUR") {
      const valorEmEuro = (valor / taxaDeCambio).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      resultado = `R$ ${valor} equivale a € ${valorEmEuro}`;
    } else if (conversionType === "EURtoBRL") {
      const valorEmReais = (valor * taxaDeCambio).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
      resultado = `€ ${valor} equivale a R$ ${valorEmReais}`;
    }

    const taxaDeCambioFormatada = taxaDeCambio.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    document.getElementById("resultado").textContent = resultado;
    document.getElementById(
      "info"
    ).textContent = `Cotação atual: $ ${taxaDeCambioFormatada} (Atualizado em: ${dataCotacao}) \nFonte: Banco Central do Brasil (https://olinda.bcb.gov.br).`;

    // Exibir o histórico da moeda selecionada
    exibirHistorico(moeda);
  } catch (error) {
    document.getElementById("resultado").textContent =
      "Erro ao obter a taxa de câmbio. Tente novamente mais tarde.";
    document.getElementById("info").textContent = "";
    document.getElementById("historico").innerHTML = ""; // Limpar o histórico em caso de erro
  }
}

const button = document.getElementById("button");
const textarea = document.getElementById("valor");

textarea.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    converterMoeda();
    const bloco = document.querySelector("#historico-box");
    bloco.style.display = "block";
  }
});

document
  .querySelector("#botão")
  .addEventListener("click", function converterMoeda() {
    const bloco = document.querySelector("#historico-box");
    bloco.style.display = "block";
  });
