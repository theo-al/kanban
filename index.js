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
    const ls = document.createElement('ul');
    const fr = form(nome);

    return painel(nome, tl, ls, fr);
}
function painel(nome, titulo, lista, form) {
    form.onsubmit = aplicar(ao_ler, lista, nome);
    const dv = document.createElement('div');
          dv.id = nome;
          dv.className = "painel";
          dv.appendChild(titulo);
          dv.appendChild(lista);
          dv.appendChild(form);
    return dv;
}

function form(id) {
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
function ao_ler(list, id, evt) {
    evt.preventDefault();

    const novo = document.getElementById('input_'+id)
    if (novo.value.trim()) {
        const item = document.createElement('li');
        item.textContent = novo.value;
        list.appendChild(item);
        novo.value = "";
    }
}

function aplicar(func, ...args) {
    return func.bind(null, ...args);
}

