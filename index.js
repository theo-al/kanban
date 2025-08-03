var preset_salvo;
var estado_salvo = {}

const presets = {
    "b64obj": {},
    "object": {},
    "kanban": {
        "kanban": {"bloqueadas":[], "a_fazer":[], "fazendo":[], "feitas":[]}
    },
    "semana": {
        "semana": {"segunda":[], "terça":[], "quarta":[], "quinta":[], "sexta":[], "sábado":[], "domingo":[]},
    },
    "mes": {
        "semana1": {"segunda":[], "terça":[], "quarta":[], "quinta":[], "sexta":[], "sábado":[], "domingo":[]},
        "semana2": {"segunda":[], "terça":[], "quarta":[], "quinta":[], "sexta":[], "sábado":[], "domingo":[]},
        "semana3": {"segunda":[], "terça":[], "quarta":[], "quinta":[], "sexta":[], "sábado":[], "domingo":[]},
        "semana4": {"segunda":[], "terça":[], "quarta":[], "quinta":[], "sexta":[], "sábado":[], "domingo":[]},
    },
};

function main() {
    const cabeçalho    = document.getElementById("cabeçalho"); // tecnicamente esssa linha não precisa existir
    const botao_salvar = document.createElement('button');
          botao_salvar.id          = "botao_salvar";
          botao_salvar.textContent = "salvar";
          botao_salvar.onclick = aplicar(salvar_estado_do_html, estado_salvo);

    const form_carregar = form_populado("carregar");
          form_carregar.onsubmit = aplicar(ao_receber_json);

    cabeçalho.appendChild(form_carregar);
    cabeçalho.appendChild(botao_salvar);

    const url = new URL(window.location.href);
    const {estado, preset} = url_para_estado(url);

    Object.assign(estado_salvo, estado);
                  preset_salvo= preset;

    mostrar_json(JSON.stringify(estado_salvo));
    atualizar_url(estado_salvo, preset_salvo);

    carregar_estado_no_html(estado_salvo);
}

function url_para_estado(url) {
    const _estado = url.searchParams.get("");
    const _hash   = url.hash.slice(1);

    const _antigo = _estado && !_hash;
    const _preset = _antigo ? "b64obj" : _hash;
    const preset  = _preset ? _preset : "kanban";

    let estado = presets[preset];
    if (_estado) {
        switch (preset) {
            case "semana": case "mes": case "kanban":
                estado = JSON.parse(atostr(_estado));
            break;
            case "b64obj":
                estado = JSON.parse(atostr(_estado));
            break;
            case "object":
                estado = JSON.parse(_estado);
            break;
            default: unreachable()
        }
    } 
    return {estado, preset};
}

function salvar_estado_do_html(estado) {
    const quadros = document.getElementsByClassName("quadro");
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

    mostrar_json(JSON.stringify(estado)); //! a mais
    atualizar_url(estado, preset_salvo);  //! a mais,global
}
function mostrar_json(json) {
    const input = document.getElementById('input_carregar');
          input.value = json;
}
function atualizar_url(estado, preset) {
    //! fazer coisas diferentes dependendo do preset
    const json = JSON.stringify(estado);
    const url = new URL(window.location.href);
          url.searchParams.set('', strtoa(json));
          url.hash = preset;
    history.replaceState(null, null, url);
}

function carregar_estado_no_html(estado) {
    //! dividir em partes (que sejam chamadas só nos momentos que precisam)
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
                const input      = document.createElement('input');
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
function ao_receber_json(evt) {
    const input  = document.getElementById('input_carregar');
    const estado = JSON.parse(input.value);
    
    carregar_estado_no_html(estado);

    return false; // para não recarregar a página
}

function painel_populado(nome) {
    const tl = document.createElement('h2');
          tl.textContent = nome;
    const ls = document.createElement('div');
          ls.id        = `lista_${nome}`;
          ls.className = "lista";
    const fr = form_populado(nome);

    return painel(nome, tl, ls, fr);
}
function painel(nome, titulo, lista, form) {
    form.onsubmit = aplicar(ao_ler_item_novo, lista, nome);
    const dv = document.createElement('div');
          dv.className = 'painel';
          dv.id        = nome;
          dv.appendChild(titulo);
          dv.appendChild(lista);
          dv.appendChild(form);
    return dv;
}

function form_populado(id) {
    const input = document.createElement('input');
          input.id   = `input_${id}`;
          input.type = 'text';
    return form(id, input);
}
function form(id, input) {
    const fieldset = document.createElement('fieldset');
          fieldset.appendChild(input);

    const form = document.createElement('form');
          form.id = `form_${id}`;
          form.appendChild(fieldset);
    return form;
}

function ao_ler_item_novo(div, id, evt) {
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

var decoder = new TextDecoder()
function atostr(base64) {
    const byte_str = atob(base64);
    const arr      = Uint8Array.from(byte_str, (m) => m.codePointAt(0));
    return decoder.decode(arr);
}

var encoder = new TextEncoder()
function strtoa(str) {
    const bytes    = encoder.encode(str);
    const byte_str = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(byte_str);
}

main()
