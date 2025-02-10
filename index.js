var nome_listas  = ["bloqueadas", "a_fazer", "fazendo", "feitas"];
var estado_salvo = {};

function main() {
    const quadro = document.getElementById("quadro");
    for (const id of nome_listas) {
        const pn = painel_populado(id);
        quadro.appendChild(pn);
    }

    const cabeçalho = document.getElementById("cabeçalho");
    const botao_salvar = document.createElement('button');
          botao_salvar.id = "botao_salvar";
          botao_salvar.textContent = "salvar";
          botao_salvar.onclick = aplicar(salvar_estado, estado_salvo);

    const form_carregar = form_populado("carregar");
          form_carregar.onsubmit = aplicar(carregar_estado);

    cabeçalho.appendChild(form_carregar)
    cabeçalho.appendChild(botao_salvar)
} main()

function painel_populado(nome) {
    const tl = document.createElement('h2');
          tl.textContent = nome;
    const ls = document.createElement('div');
          ls.id = `lista_${nome}`;
    const fr = form_populado(nome);

    return painel(nome, tl, ls, fr);
}
function painel(nome, titulo, lista, form) {
    form.onsubmit = aplicar(ao_ler, lista, nome);
    const dv = document.createElement('div');
          dv.id = nome;
          dv.className = 'painel';
          dv.appendChild(titulo);
          dv.appendChild(lista);
          dv.appendChild(form);
    return dv;
}

function form_populado(id) {
    const input    = document.createElement('input');
          input.id   = `input_${id}`;
          input.type = 'text';
    return form(id, input);
}
function form(id, input) {
    const fieldset = document.createElement('fieldset');
          fieldset.appendChild(input);
    const form     = document.createElement('form');
          form.id  = `form_${id}`;
          form.appendChild(fieldset);
    return form;
}

function salvar_estado(estado) {
    const input = document.getElementById('input_carregar');

    for (const id of nome_listas) {
        const lista = document.getElementById(`lista_${id}`);

        const arr = [];
        for (const item of lista.getElementsByTagName('input')) {
            arr.push(item.value);
        } estado[id] = arr;
    }

    input.value = JSON.stringify(estado)
}
function carregar_estado(evt) {
    const input  = document.getElementById('input_carregar');
    const estado = JSON.parse(input.value)

    for (const [id, lista] of Object.entries(estado)) {
        const div = document.getElementById(`lista_${id}`);
              div.textContent = "";
        for (let i = 0; i < lista.length; i++) {
            const input = document.createElement('input');
                  input.id   = `input_${id}_${i}`;
                  input.type = 'text';
            const fr = form(`${id}_${i}`, input);
                  input.value = lista[i];
                  fr.addEventListener('blur', aplicar(remover_se_esvaziar, fr, input), true); //! descobrir pq onblur não funcionou
                  fr.onsubmit =               aplicar(remover_se_esvaziar, fr, input);
            div.appendChild(fr);
        }
    }
    return false; // para não recarregar a página
}

function ao_ler(div, id, evt) {
    const n     = div.childElementCount;
    const novo  = document.getElementById(`input_${id}`);
    const texto = novo.value.trim(); novo.value = "";

    if (texto) {
        const input = document.createElement('input');
              input.id   = `input_${id}_${n}`;
              input.type = 'text';
        const fr = form(`${id}_${n}`, input);
              input.value = texto;
              fr.addEventListener('blur', aplicar(remover_se_esvaziar, fr, input), true); //! descobrir pq onblur não funcionou
              fr.onsubmit =               aplicar(remover_se_esvaziar, fr, input);
        div.appendChild(fr);
    }
    return false; // para não recarregar a página
}
function remover_se_esvaziar(form, input, evt) {
    if (!input.value) form.parentNode.removeChild(form);
    return false; // para não recarregar a página
}

function aplicar(func, ...args) { // para aplicação parcial
    return func.bind(null, ...args);
}

