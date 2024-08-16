function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth is 0-indexed
    const day = String(date.getDate()).padStart(2, '0') - 1;

    return `${year}-${month}-${day} `;
}
async function converterMoeda() {
    const valor = document.getElementById('valor').value;
    const conversionType = document.getElementById('conversionType').value;

    if (valor === '') {
        alert('Por favor, insira um valor.');
        return;
    }

    try {
        const today = new Date();
        const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() - 1).padStart(2, '0')}-${String(today.getFullYear())}`;
        const apiUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=%27${formattedDate}%27&$top=100&$skip=0&$format=json&$select=cotacaoVenda`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.value.length === 0) {
            document.getElementById('resultado').textContent = 'Não foi possível obter a cotação para a data atual. Tente novamente mais tarde.';
            document.getElementById('info').textContent = '';
            return;
        }

        const taxaDeCambio = parseFloat(data.value[0].cotacaoVenda);
        const dataCotacao = formatDate(today);

        let resultado;
        if (conversionType === "BRLtoUSD") {
            const valorEmDolar = (valor / taxaDeCambio).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            resultado = `R$ ${valor} equivale a $ ${valorEmDolar}`;
        } else {
            const valorEmReais = (valor * taxaDeCambio).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            resultado = `$ ${valor} equivale a R$ ${valorEmReais}`;
        }

        const taxaDeCambioFormatada = taxaDeCambio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('resultado').textContent = resultado;
        document.getElementById('info').textContent = `Cotação atual: $ ${taxaDeCambioFormatada} (Atualizado em: ${dataCotacao}) \nFonte: Banco Central do Brasil (https://olinda.bcb.gov.br)`;
    } catch (error) {
        document.getElementById('resultado').textContent = 'Erro ao obter a taxa de câmbio. Tente novamente mais tarde.';
        document.getElementById('info').textContent = '';
        console.log(error)
    }
}