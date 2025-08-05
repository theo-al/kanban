//! melhoria ux: drag&drop
//! melhoria ux: recarregar quando muda a hash
//! melhoria interna: atualizar só o que precisa, primeiro o estado e depois o html

var preset_salvo;
var estado_salvo = {}

const presets = {
    "b64obj": [[], [[]]], "object": [[], [[]]],
    "kanban": [
        [""], [
            ["bloqueadas", "a_fazer", "fazendo", "feitas"]
        ]
    ],
    "semana": [
        [""], [
            ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]
        ],
    ],
    "mes": [
        ["semana_1", "semana_2", "semana_3", "semana_4"], [
            ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
            ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
            ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
            ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
        ]
    ],
};


function main() {
    const cabeçalho    = document.getElementById("cabeçalho"); // tecnicamente esssa linha não precisa existir
    const botao_salvar = document.createElement('button');
          botao_salvar.id          = "botao_salvar";
          botao_salvar.textContent = "salvar";
          botao_salvar.onclick = aplicar(salvar_estado_do_html, estado_salvo);

    const form_carregar = form_vazio("carregar");
          form_carregar.onsubmit = aplicar(ao_receber_json);

    cabeçalho.appendChild(form_carregar);
    cabeçalho.appendChild(botao_salvar);

    const url = new URL(window.location.href);
    const {estado, preset} = url_para_estado(url);

    Object.assign(estado_salvo, estado);
                  preset_salvo= preset;

    mostrar_json(JSON.stringify(estado_salvo));
    atualizar_url(estado_salvo, preset_salvo);

    carregar_estado_para_html(estado_salvo, preset_salvo);

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 's') {
            salvar_estado_do_html(estado_salvo);
            e.preventDefault(); // prevent save dialog
        }
    });
    const salvador = setInterval(
        aplicar(salvar_estado_do_html, estado_salvo), 240_000/*4m*/
    );
}

function preset_para_objeto(preset) {
    const objeto = {};
    const quadros = preset[0];
    const paineis = preset[1];
    for (const [idx, quadro] of quadros.entries()) {
        objeto[quadro] = {};
        for (const painel of paineis[idx]) {
            objeto[quadro][painel] = [];
        }
    }
    return objeto;
}
function objeto_para_preset(obj) {
    const _quadros = [];
    const _paineis = [];
    for (const [nome_quadro, paineis] of Object.entries(obj)) {
        _quadros.push(nome_quadro);
        for (const [nome_painel, lista] of Object.entries(paineis)) {
            _paineis.push(nome_painel);
        }
    }
    return [_quadros, _paineis];
}
function objeto_para_resumo(obj) {
    const _paineis = [];
    for (const [_, paineis] of Object.entries(obj)) {
        for (const [_, lista] of Object.entries(paineis)) {
            _paineis.push(lista);
        }
    }
    return _paineis;
}
function resumo_para_objeto(arr, nome_preset) {
    const objeto = {};
    const nomes_quadros = presets[nome_preset][0];
    const nomes_paineis = presets[nome_preset][1];
    for (const [qd, nome_quadro] of nomes_quadros.entries()) {
        objeto[nome_quadro] = {};
        for (const [pn, nome_painel] of nomes_paineis[qd].entries()) {
            objeto[nome_quadro][nome_painel] = arr[pn] || [];
        }
    }
    return objeto;
}

function url_para_estado(url) {
    const _estado = url.searchParams.get("");
    const _hash   = url.hash.slice(1);

    const _antigo = _estado && !_hash;
    const _preset = _antigo ? "b64obj" : _hash;
    const preset  = _preset ? _preset : "kanban";

    let estado = preset_para_objeto(presets[preset]);
    if (_estado) {
        switch (preset) {
          case "kanban": case "semana": case "mes":
              const arr = JSON.parse(atostr(_estado));
              estado = resumo_para_objeto(arr, preset);
          break;

          case "b64obj": estado = JSON.parse(atostr(_estado)); break;
          case "object": estado = JSON.parse(_estado);         break;
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
    const url = new URL(window.location.href);

    const json = JSON.stringify(estado);
    switch (preset) {
      case "b64obj": case "object":
          url.searchParams.set('', strtoa(json));
          url.hash = "b64obj";
      break;
      case "kanban": case "semana": case "mes":
          const res = objeto_para_resumo(estado);
          const ret = JSON.stringify(res);
          url.searchParams.set('', strtoa(ret));
          url.hash = preset;
      break;
    }
    history.replaceState(null, null, url);
}

function carregar_estado_para_html(estado, preset) {
    //! dividir em partes (que sejam chamadas só nos momentos que precisam)
    const cabeçalho = document.getElementById("cabeçalho");
    const [título]  = cabeçalho.getElementsByTagName("h1");
    switch (preset) {
      case "mes": case "semana": título.textContent = "puranā"; break;
      default:                   título.textContent = "kanban"; break;
    }

    const quadros = document.getElementById("quadros");
          quadros.textContent = "";
    for (const [id_quadro, paineis] of Object.entries(estado)) {
        const nome = document.createElement("h2");
              nome.textContent = id_quadro.replace("_", " ");
        const quadro = document.createElement("div");
              quadro.className = "quadro";
              quadro.id        = `quadro_${id_quadro}`;
              quadro.appendChild(nome);
        quadros.appendChild(quadro);
        for (const [id_lista, lista] of Object.entries(paineis)) {
            const pn = painel_vazio(id_lista);
            quadro.appendChild(pn);
            //! só funciona na ordem que tá (appendChild etc) (criar lista e passar pra função)
            const div = document.getElementById(`lista_${id_lista}`); 
                  div.textContent = "";
            for (let i = 0; i < lista.length; i++) { //! repetido
                const id = `${id_lista}_${i}`;
                const fr = form(id, input(id, lista[i]), {
                    onblur:   remover_se_esvaziar,
                    onsubmit: remover_se_esvaziar,
                });
                div.appendChild(fr);
            }
        }
    }
}
function ao_receber_json(evt) {
    const input  = document.getElementById('input_carregar');
    const estado = JSON.parse(input.value);
    Object.assign(estado_salvo, estado);
                  preset_salvo= "object";
    
    carregar_estado_para_html(estado_salvo, preset_salvo);
    return false; // para não recarregar a página
}

function painel_vazio(nome) {
    const tl = document.createElement('h2');
          tl.textContent = nome;
    const ls = document.createElement('div');
          ls.id        = `lista_${nome}`;
          ls.className = "lista";
    const fr = form_vazio(nome);

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

function form_vazio(id) {
    return form(id, input(id));
}
function form(id, input, {onsubmit=null, onblur=null}={}) {
    const fieldset = document.createElement('fieldset');
          fieldset.appendChild(input);

    const form = document.createElement('form');
          form.id = `form_${id}`;
          form.appendChild(fieldset);

    if (onsubmit)
        form.onsubmit = aplicar(onsubmit, form, input);
    if (onblur) //! descobrir pq onblur não funcionou
        form.addEventListener('blur', aplicar(onblur, form, input), true);
    return form;
}

function input(id, texto="") {
    const input = document.createElement('input');
          input.id    = `input_${id}`;
          input.type  = 'text';
          input.value = texto;
    return input;
}

function ao_ler_item_novo(div, _id, evt) {
    const n     = div.childElementCount;
    const novo  = document.getElementById(`input_${_id}`);
    const texto = novo.value.trim(); novo.value = "";

    if (texto) { //! repetido
        const id = `${_id}_${n}`;
        const fr = form(id, input(id, texto), {
            onblur:   remover_se_esvaziar,
            onsubmit: remover_se_esvaziar,
        });
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
