const entradaArquivo = document.getElementById("fileInput");
let dadosCSV = [];

entradaArquivo.addEventListener("change", (evento) => {
  const arquivo = evento.target.files[0];
  const leitor = new FileReader();

  leitor.onload = (evento) => {
    const textoCSV = evento.target.result;
    const linhas = textoCSV.split("\n");

    const cabecalhos = linhas[0]
      .split(";")
      .map((cabecalho) => cabecalho.replace(/['"]+/g, ""));
    const colunasParaManter = ["NOME_TITULAR", "VL_FATURADO"];
    const indicesParaManter = cabecalhos
      .map((cabecalho, indice) =>
        colunasParaManter.includes(cabecalho.trim()) ? indice : null
      )
      .filter((indice) => indice !== null);

    const linhasProcessadas = linhas
      .slice(1)
      .map((linha) => linha.replace(/['"]/g, ""));
    dadosCSV = processarCSV(linhasProcessadas, indicesParaManter);
    console.log(dadosCSV);
    dadosCSV.sort((a, b) => a[0].localeCompare(b[0]));

    renderizarCabecalhoTabela(colunasParaManter);
    renderizarLinhasTabela(dadosCSV);
    renderizarTotalizador(dadosCSV);
  };

  leitor.readAsText(arquivo);
});

function processarCSV(linhas, indicesParaManter) {
  const dadosAgrupados = {};

  linhas.forEach((linha) => {
    const colunas = linha.split(";");
    if (colunas.length > Math.max(...indicesParaManter)) {
      const nome = colunas[indicesParaManter[1]].toUpperCase().trim();  
      let valor = colunas[indicesParaManter[0]].trim().replace(",", ".");  
      console.log("Nome:", nome, " | Valor original:", valor);  

      const valorNumerico = parseFloat(valor);

      if (!isNaN(valorNumerico)) {
        if (!dadosAgrupados[nome]) {
          dadosAgrupados[nome] = 0;
        }
        dadosAgrupados[nome] += valorNumerico;
      }
    }
  });

  return Object.entries(dadosAgrupados).map(([nome, valor]) => [
    nome,
    valor.toFixed(2).replace(".", ","), 
  ]);
}

function renderizarCabecalhoTabela(cabecalhos) {
  const cabecalhoTabela = document.getElementById("tableHeader");
  cabecalhoTabela.innerHTML = "";
  cabecalhos.forEach((cabecalho) => {
    const th = document.createElement("th");
    th.textContent = cabecalho;
    cabecalhoTabela.appendChild(th);
  });
}

function renderizarLinhasTabela(linhas) {
  const corpoTabela = document.querySelector("tbody");
  corpoTabela.innerHTML = "";
  linhas.forEach((colunas) => {
    const linha = document.createElement("tr");
    colunas.forEach((coluna) => {
      const celula = document.createElement("td");
      celula.textContent = coluna;
      linha.appendChild(celula);
    });
    corpoTabela.appendChild(linha);
  });
}

function renderizarTotalizador(linhas) {
  const corpoTabela = document.querySelector("tbody");
  
  const linhaTotalAnterior = document.getElementById("linhaTotal");
  if (linhaTotalAnterior) {
    corpoTabela.removeChild(linhaTotalAnterior);
  }

  const total = linhas.reduce((acc, colunas) => {
    const valor = parseFloat(colunas[1].replace(",", "."));
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  const linhaTotal = document.createElement("tr");
  linhaTotal.id = "linhaTotal";

  const celulaNome = document.createElement("td");
  celulaNome.textContent = "Totalizador";
  celulaNome.style.fontWeight = "bold";
  linhaTotal.appendChild(celulaNome);

  const celulaValor = document.createElement("td");
  celulaValor.textContent = total.toFixed(2).replace(".", ",");
  celulaValor.style.fontWeight = "bold";
  linhaTotal.appendChild(celulaValor);

  corpoTabela.appendChild(linhaTotal);
}

document.getElementById("gerarXLSX").onclick = function gerarXLSX() {
  const novaPlanilha = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["Nome", "Valor (R$)"], ...dadosCSV]);
  XLSX.utils.book_append_sheet(novaPlanilha, ws, "Dados");

  const arquivoXLSX = XLSX.write(novaPlanilha, {
    bookType: "xlsx",
    type: "binary",
  });

  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff;
    }
    return buf;
  }

  const blob = new Blob([s2ab(arquivoXLSX)], {
    type: "application/octet-stream",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Unimed Mensalidade.xlsx";
  link.click();
};
