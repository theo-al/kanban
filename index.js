main()

function main() {
    const quadro = document.getElementById("quadro");
    const listas = ["bloqueadas", "a_fazer", "fazendo", "feitas"];
    
    for (const id of listas) {
        const pn = painel_populado(id);
        quadro.appendChild(pn);
    }
}

function painel_populado(nome) {
    const tl = document.createElement('h2');
          tl.textContent = nome;
    const ls = document.createElement('div');
    const fr = form(nome);

    return painel(nome, tl, ls, fr);
}
function painel(nome, titulo, lista, form) {
    form.onsubmit = aplicar(ao_ler, lista, nome, {n: 0});
    const dv = document.createElement('div');
          dv.id = nome;
          dv.className = "painel";
          dv.appendChild(titulo);
          dv.appendChild(lista);
          dv.appendChild(form);
    return dv;
}

function form(id) { //! -> linha
    const form     = document.createElement('form');
          form.id  = "form_"+id;
    const fieldset = document.createElement('fieldset');
    const input    = document.createElement('input');
          input.id   = "input_"+id;
          input.type = "text";
    fieldset.appendChild(input);
    form.appendChild(fieldset);
    return form;
}
function ao_ler(div, id, estado, evt) {
    const n     = estado.n;
    const novo  = document.getElementById('input_'+id);
    const texto = novo.value.trim(); novo.value = "";

    if (texto) {
        estado.n += 1;
        const fr = form(id+"_"+n);
              fr[1].value = texto; //! acesso estranho. esse é o input. dá pra fazer com o id, ou o form poderia aceitar o input também
              fr.addEventListener("blur", aplicar(remover_se_esvaziar, fr, fr[1]), true); //! descobrir pq onblur não funcionou //! acesso estranho igual
              fr.onsubmit =               aplicar(remover_se_esvaziar, fr, fr[1]);        //! acesso estranho igual
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

