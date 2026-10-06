let usuarioLogado = null;

async function loginUsuario(usuario, senha) {
    return await fazerLogin(usuario, senha);
}

function setAuthMode(mode) {
    const cadastroCard = document.getElementById('cadastroCard');
    const loginCard = document.getElementById('loginCard');
    const toggleButton = document.getElementById('toggleAuthMode');

    if (!cadastroCard || !loginCard || !toggleButton) {
        return;
    }

    const isCadastro = mode === 'cadastro';
    cadastroCard.classList.toggle('is-active', isCadastro);
    cadastroCard.classList.toggle('hidden', !isCadastro);
    loginCard.classList.toggle('is-active', !isCadastro);
    loginCard.classList.toggle('hidden', isCadastro);
    toggleButton.textContent = isCadastro ? 'Já tenho uma conta' : 'Quero me cadastrar';
}

document.getElementById('toggleAuthMode').addEventListener('click', function () {
    const cadastroCard = document.getElementById('cadastroCard');
    const loginCard = document.getElementById('loginCard');
    const shouldGoToCadastro = !cadastroCard.classList.contains('is-active');
    setAuthMode(shouldGoToCadastro ? 'cadastro' : 'login');
});

setAuthMode('login');

document.getElementById('formCadastro').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('cadNome').value.trim();
    const turma = document.getElementById('cadTurma').value.trim();
    const usuario = document.getElementById('cadUsuario').value.trim();
    const senha = document.getElementById('cadSenha').value.trim();
    const msg = document.getElementById('cadMsg');

    if (!nome || !turma || !usuario || !senha) {
        msg.textContent = 'Por favor, preencha todos os campos.';
        return;
    }

    const resultado = await cadastrarUsuario(nome, turma, usuario, senha);
    if (resultado.error) {
        msg.textContent = 'Erro ao cadastrar. Tente outro nome de usuário.';
        return;
    }

    msg.textContent = 'Conta criada! Faça login abaixo.';
    e.target.reset();
});

document.getElementById('formLogin').addEventListener('submit', async function (e) {
    e.preventDefault();

    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const msg = document.getElementById('loginMsg');

    const resultado = await loginUsuario(usuario, senha);
    if (resultado.error) {
        msg.textContent = 'falha ao realizar o login';
        alert('falha ao realizar o login');
        return;
    }

    usuarioLogado = resultado.data;
    sessionStorage.setItem('financappUsuario', JSON.stringify(usuarioLogado));

    msg.textContent = 'login realizado com sucesso';
    alert('login realizado com sucesso');

    document.getElementById('telaAuth').hidden = true;
    document.getElementById('telaApp').hidden = false;
    document.getElementById('btnSair').hidden = false;

    mostrarPerfil(usuarioLogado);
    atualizarExtrato();
});

function mostrarPerfil(usuario) {
    document.getElementById('perfilNome').textContent = usuario.nome;
    document.getElementById('perfilTurma').textContent = usuario.turma;
    if (usuario.foto_url) {
        document.getElementById('perfilFoto').src = usuario.foto_url;
    }
}

document.getElementById('btnSair').addEventListener('click', function () {
    usuarioLogado = null;
    sessionStorage.removeItem('financappUsuario');
    document.getElementById('telaAuth').hidden = false;
    document.getElementById('telaApp').hidden = true;
    document.getElementById('btnSair').hidden = true;
    setAuthMode('login');
});

const usuarioSalvo = sessionStorage.getItem('financappUsuario');
if (usuarioSalvo) {
    usuarioLogado = JSON.parse(usuarioSalvo);
    document.getElementById('telaAuth').hidden = true;
    document.getElementById('telaApp').hidden = false;
    document.getElementById('btnSair').hidden = false;
    mostrarPerfil(usuarioLogado);
    atualizarExtrato();
}

async function atualizarExtrato() {
    const resultado = await carregarLancamentos(usuarioLogado.id);
    const extratoContainer = document.getElementById('extratoContainer');
    extratoContainer.innerHTML = '';
    
    if (resultado.error) {
        extratoContainer.textContent = 'Erro ao carregar extrato.';
        return;
    }

    let saldo = 0;
    resultado.data.forEach(function(lancamento) {
        extratoContainer.appendChild(renderLancamento(lancamento));
        if (lancamento.tipo === 'receita') {
            saldo += lancamento.valor;
        } else {
            saldo -= lancamento.valor;
        }
    });
  
    const saldoValor = document.getElementById('saldoValor');
    saldoValor.textContent = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    saldoValor.classList.toggle('positivo', saldo >= 0);
    saldoValor.classList.toggle('negativo', saldo < 0);
}

function renderLancamento(lancamento) {
    const card = document.createElement('div');
    card.className = 'lancamento-card';
  
    const descricao = document.createElement('p');
    descricao.className = 'lancamento-desc';
    descricao.textContent = lancamento.descricao;

    const data = document.createElement('span');
    data.className = 'lancamento-data';
    data.textContent = new Date(lancamento.criado_em).toLocaleDateString('pt-BR');

    const valor = document.createElement('span');
    valor.className = 'lancamento-valor' + (lancamento.tipo === 'receita' ? ' receita' : ' despesa');
    const sinal = lancamento.tipo === 'receita' ? '+' : '-';
    valor.textContent = sinal + ' ' + lancamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'lancamento-tags';
    (lancamento.tags || []).forEach(function(tag) {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.textContent = tag;
        tagsDiv.appendChild(badge);
    });

    card.appendChild(descricao);
    card.appendChild(data);
    card.appendChild(valor);
    card.appendChild(tagsDiv);

    return card;
}

document.getElementById('formLancamento').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const descricao = document.getElementById('lancDescricao').value.trim();
    const valor = document.getElementById('lancValor').value;
    const tipo = document.getElementById('lancTipo').value;
    const tagsTexto = document.getElementById('lancTags').value;

    if (!descricao || !valor) {
        return;
    }

    const resultado = await criarLancamento(usuarioLogado.id, descricao, valor, tipo);
    if (resultado.error) {
        return;
    }

    const tags = tagsTexto.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    for (const tag of tags) {
        await adicionarTag(resultado.data.id, tag);
    }

    e.target.reset();
    atualizarExtrato();
});
