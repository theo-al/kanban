var url = window.location.hostname;
var estado_salvo = {};

function main() {
    const cabeçalho = document.getElementById("cabeçalho");
    const botao_salvar = document.createElement('button');
          botao_salvar.id = "botao_salvar";
          botao_salvar.textContent = "salvar";
          botao_salvar.onclick = aplicar(salvar_estado, estado_salvo);

    const form_carregar = form_populado("carregar");
          form_carregar.onsubmit = aplicar(ao_receber_estado);

    cabeçalho.appendChild(form_carregar)
    cabeçalho.appendChild(botao_salvar)

    const params = new URLSearchParams(window.location.search);
    const estado = params.get("");
    const estado_padrão = {"kanban": {"bloqueadas": [],
                                      "a_fazer":    [],
                                      "fazendo":    [],
                                      "feitas":     []}};
    if (estado) estado_salvo = JSON.parse(estado);
    else        estado_salvo = estado_padrão;
    carregar_estado(estado_salvo); //! colocar botões levando a quadros diferentes
    mostrar_estado(estado_salvo);
} main()

function salvar_estado(estado) {
    const quadros = document.getElementsByClassName("quadro")
    for (const quadro of quadros) {
        const nome_quadro = desprefixar(quadro.id, "quadro_");

        estado[nome_quadro] = {};
        const listas = quadro.getElementsByClassName("lista");
        for (const lista of listas) {
            const id = desprefixar(lista.id, "lista_");

            const arr = [];
            for (const item of lista.getElementsByTagName('input')) {
                arr.push(item.value);
            }

            estado[nome_quadro][id] = arr;
        }
    }

    mostrar_estado(estado);
}
function mostrar_estado(estado) {
    const json  = JSON.stringify(estado);
    const input = document.getElementById('input_carregar');
          input.value = json;

    const params = new URLSearchParams(window.location.search);
          params.set('', json);
    history.replaceState(null, null, "?" + params.toString());
}

function carregar_estado(estado) {
    const quadros = document.getElementById("quadros")
          quadros.textContent = "";
    for (const [id_quadro, paineis] of Object.entries(estado)) {
        const quadro = document.createElement("div");
              quadro.className = "quadro";
              quadro.id        = `quadro_${id_quadro}`;
        quadros.appendChild(quadro);
        for (const [id, lista] of Object.entries(paineis)) {
            const pn = painel_populado(id);
            quadro.appendChild(pn);
            const div = document.getElementById(`lista_${id}`); //! só funciona na ordem que tá (appendChild etc) (criar lista e passar pra dentro)
                  div.textContent = "";
            for (let i = 0; i < lista.length; i++) { //! corpo repetido
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
    }
}
function ao_receber_estado(evt) {
    const input  = document.getElementById('input_carregar');
    const estado = JSON.parse(input.value);
    
    carregar_estado(estado);

    return false; // para não recarregar a página
}

function painel_populado(nome) {
    const tl = document.createElement('h2');
          tl.textContent = nome;
    const ls = document.createElement('div');
          ls.id = `lista_${nome}`;
          ls.className = "lista"
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

function ao_ler(div, id, evt) {
    const n     = div.childElementCount;
    const novo  = document.getElementById(`input_${id}`);
    const texto = novo.value.trim(); novo.value = "";

    if (texto) { //! corpo_repetido
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

function desprefixar(str, prefixo) {
    if (str.startsWith(prefixo)) return str.slice(prefixo.length)
    else                         return str
}

