//! bug (grande): mesmo nome de lista em mais de um quadro não funciona
//!     - isso faz o preset mês ficar inutilizável
//! melhoria ux: drag&drop
//! melhoria ux: recarregar quando muda a hash
//! melhoria ui: diminuir o form vazio (e aumentar quando selecionar)
//! melhoria interna: usar propriedades dos eventos nos callbacks
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

    const form_carregar = form("carregar");
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
        const quadro = quadro_vazio(id_quadro);
        quadros.appendChild(quadro);
        for (const [id_lista, itens] of Object.entries(paineis)) {
            quadro.appendChild(painel(id_lista, itens));
        }
    }
}

function quadro_vazio(nome) {
    const quadro = document.createElement("div");
          quadro.className = "quadro";
          quadro.id        = `quadro_${nome}`;

    if (nome) {
        const título = document.createElement("h2");
              título.textContent = nome.replace("_", " ");
        quadro.appendChild(título);
    }
    return quadro;
}

function painel(nome, itens=[]) {
    const tl = document.createElement('h2');
          tl.textContent = nome;
    const ls = lista(nome, itens);
    const fr = form(nome, "", {
        onsubmit: aplicar(ao_ler_item_novo, ls, nome),
    });
    const dv = document.createElement('div');
          dv.className = 'painel';
          dv.id        = nome;
          dv.appendChild(tl);
          dv.appendChild(ls);
          dv.appendChild(fr);
    return dv;
}

function lista(nome, itens=[]) {
    const div = document.createElement("div")
          div.id        = `lista_${nome}`;
          div.className = "lista";
    for (let i = 0; i < itens.length; i++) { //! repetido
        const id = `${nome}_${i}`;
        const fr = form(id, itens[i], {
            onblur:   remover_se_esvaziar,
            onsubmit: remover_se_esvaziar,
        });
        div.appendChild(fr);
    }
    return div;
}

function form(id, texto="", {onsubmit=null, onblur=null}={}) {
    const inpt = input(id, texto);
    const fieldset = document.createElement('fieldset');
          fieldset.appendChild(inpt);

    const form = document.createElement('form');
          form.id = `form_${id}`;
          form.appendChild(fieldset);

    //! ver se manter esses callbacks assim
    if (onsubmit)
        form.onsubmit = aplicar(onsubmit, form, inpt);
    if (onblur) //! descobrir pq onblur não funcionou
        form.addEventListener('blur', aplicar(onblur, form, inpt), true);
    return form;
}

function input(id, texto="") {
    const input = document.createElement('input');
          input.id    = `input_${id}`;
          input.type  = 'text';
          input.value = texto;
    return input;
}

function ao_receber_json(_evt) {
    const input  = document.getElementById('input_carregar');
    const estado = JSON.parse(input.value);
    Object.assign(estado_salvo, estado);
                  preset_salvo= "object";
    
    carregar_estado_para_html(estado_salvo, preset_salvo);
    return false; // para não recarregar a página
}

function ao_ler_item_novo(lista, nome, _fr, _inpt, _evt) {
    const n     = lista.childElementCount;
    const novo  = document.getElementById(`input_${nome}`);
    const texto = novo.value.trim(); novo.value = "";

    if (texto) { //! repetido
        const id = `${nome}_${n}`;
        const fr = form(id, texto, {
            onblur:   remover_se_esvaziar,
            onsubmit: remover_se_esvaziar,
        });
        lista.appendChild(fr);
    }
    return false; // para não recarregar a página
}
function remover_se_esvaziar(form, input, _evt) {
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
