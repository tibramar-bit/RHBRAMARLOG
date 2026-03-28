// Configuração Supabase
const SUPABASE_URL = 'https://qefixlmqxlppblfablnf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ezBVjQjOIjBmzjK_CE2tLg_8iDMFBG_'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar login no GitHub Pages
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

let currentCandidato = null;

async function loadCandidatos() {
    try {
        const { data, error } = await supabaseClient
            .from('candidatos')
            .select('*')
            .order('data_envio', { ascending: false });

        if (error) throw error;

        const list = document.getElementById('candidatos-list');
        list.innerHTML = '';

        data.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50 transition';
            row.innerHTML = `
                <td class="p-4 text-sm text-gray-500">${new Date(c.data_envio).toLocaleDateString()}</td>
                <td class="p-4 font-medium text-gray-800">${c.nome_completo}</td>
                <td class="p-4 text-sm text-gray-600">${c.cargo_pretendido}</td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(c.status)}">
                        ${c.status}
                    </span>
                </td>
                <td class="p-4 space-x-2">
                    <button onclick='viewCandidato(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="text-blue-600 hover:text-blue-800 font-medium">Ver/Editar</button>
                    <button onclick='deleteCandidato(${c.id})' class="text-red-600 hover:text-red-800 font-medium">Apagar</button>
                </td>
            `;
            list.appendChild(row);
        });
    } catch (err) {
        console.error('Erro ao carregar candidatos:', err);
        alert('Erro ao carregar dados do Supabase: ' + err.message);
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'Aprovado': return 'bg-green-100 text-green-700';
        case 'Reprovado': return 'bg-red-100 text-red-700';
        case 'Em Análise': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

async function updateStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('candidatos')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;
        
        loadCandidatos();
        closeModal();
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar: ' + err.message);
    }
}

async function deleteCandidato(id) {
    if (confirm('Tem certeza que deseja apagar este candidato?')) {
        try {
            const { error } = await supabaseClient
                .from('candidatos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadCandidatos();
        } catch (err) {
            console.error('Erro ao apagar candidato:', err);
            alert('Erro ao apagar: ' + err.message);
        }
    }
}

function viewCandidato(c) {
    currentCandidato = c;
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    
    // Parse JSON data
    const escolaridade = typeof c.escolaridade === 'string' ? JSON.parse(c.escolaridade || '{}') : (c.escolaridade || {});
    const idiomas = typeof c.idiomas === 'string' ? JSON.parse(c.idiomas || '[]') : (c.idiomas || []);
    const experiencias = typeof c.experiencias === 'string' ? JSON.parse(c.experiencias || '[]') : (c.experiencias || []);

    content.innerHTML = `
        <div id="pdf-container" class="space-y-8 bg-white p-12 max-w-[850px] mx-auto shadow-sm border">
            <header class="text-center border-b-4 border-blue-900 pb-6 mb-10">
                <img src="img/logo.jpg" alt="Logo Bramarlog" onerror="this.style.display='none'" class="w-40 mx-auto mb-6">
                <h1 class="text-4xl font-extrabold text-blue-900 tracking-tight">CURRÍCULO DE RECRUTAMENTO</h1>
                <p class="text-gray-600 font-semibold uppercase tracking-widest mt-2">Bramarlog Logística</p>
            </header>

            <section class="grid grid-cols-2 gap-x-12 gap-y-6 text-base mb-10">
                <div class="space-y-3">
                    <p class="border-b border-gray-100 pb-2"><strong>Nome:</strong> ${c.nome_completo}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Idade:</strong> ${c.idade} anos</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Cargo Pretendido:</strong> ${c.cargo_pretendido}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Forma Recrutamento:</strong> ${c.forma_recrutamento || '-'}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Indicação:</strong> ${c.indicacao_de || '-'}</p>
                </div>
                <div class="space-y-3">
                    <p class="border-b border-gray-100 pb-2"><strong>Reside em:</strong> ${c.reside_em || '-'}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Naturalidade:</strong> ${c.naturalidade}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Estado Civil:</strong> ${c.estado_civil}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Qtd Filhos:</strong> ${c.quantidade_filhos}</p>
                    <p class="border-b border-gray-100 pb-2"><strong>Pretensão Salarial:</strong> ${c.pretensao_salarial}</p>
                </div>
                <div class="col-span-2 border-b border-gray-100 pb-2">
                    <p><strong>Transporte:</strong> ${c.tem_transporte || '-'} ${c.qual_transporte ? '(' + c.qual_transporte + ')' : ''}</p>
                </div>
            </section>

            <section class="mb-10">
                <h3 class="text-xl font-bold text-white bg-blue-900 px-4 py-2 mb-6 uppercase tracking-widest rounded-sm">Formação Educacional</h3>
                <div class="grid grid-cols-1 gap-4 text-base">
                    ${escolaridade.fundamental ? `
                        <div class="p-4 bg-gray-50 rounded-md border-l-4 border-blue-900">
                            <p><strong>2º Grau:</strong> ${escolaridade.inst_2grau || '-'} (${escolaridade.periodo_2grau || '-'})</p>
                        </div>
                    ` : ''}
                    ${escolaridade.tecnico ? `
                        <div class="p-4 bg-gray-50 rounded-md border-l-4 border-blue-900">
                            <p><strong>Técnico:</strong> ${escolaridade.qual_tecnico || '-'} - ${escolaridade.tecnico_status || '-'} (${escolaridade.periodo_tecnico || '-'})</p>
                        </div>
                    ` : ''}
                    ${escolaridade.superior_status ? `
                        <div class="p-4 bg-gray-50 rounded-md border-l-4 border-blue-900">
                            <p><strong>Superior:</strong> ${escolaridade.curso_superior || '-'} - ${escolaridade.superior_status || '-'} (${escolaridade.inst_superior || '-'}) | Período: ${escolaridade.periodo_superior || '-'}</p>
                        </div>
                    ` : ''}
                    <div class="grid grid-cols-2 gap-6 mt-4 p-2">
                        <p><strong>Outros:</strong> ${escolaridade.outros || '-'}</p>
                        <p><strong>Idiomas:</strong> ${Array.isArray(idiomas) && idiomas.length > 0 ? idiomas.map(i => `${i.idioma} (${i.nivel || 'N/I'})`).join(', ') : 'Não possui'}</p>
                        <p><strong>Informática:</strong> ${c.informatica || '-'}</p>
                        <p><strong>Exp. Exterior:</strong> ${c.experiencia_fora_pais || '-'} ${c.quais_paises ? '(' + c.quais_paises + ')' : ''}</p>
                    </div>
                </div>
            </section>

            <section class="mb-10">
                <h3 class="text-xl font-bold text-white bg-blue-900 px-4 py-2 mb-6 uppercase tracking-widest rounded-sm">Experiências Profissionais</h3>
                ${c.primeiro_emprego ? '<p class="italic text-gray-600 p-4 bg-gray-50 rounded">Este é o meu primeiro emprego.</p>' : 
                    experiencias.map((exp, idx) => `
                        <div class="mb-6 p-4 bg-white rounded-md border border-gray-200 text-base shadow-sm">
                            <p class="font-bold text-blue-900 uppercase text-lg mb-2">${idx + 1}. ${exp.empresa} - ${exp.cargo}</p>
                            <div class="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <p><strong>Telefone:</strong> ${exp.telefone_empresa || '-'}</p>
                                <p><strong>Período:</strong> ${exp.periodo}</p>
                                <p><strong>Área:</strong> ${exp.area}</p>
                                <p><strong>Salário:</strong> ${exp.salario}</p>
                                <p><strong>Benefícios:</strong> ${exp.beneficios.join(', ')}</p>
                            </div>
                            <p class="mt-2 text-gray-800 leading-relaxed"><strong>Atividade:</strong> ${exp.atividade}</p>
                            <p class="mt-2 text-gray-800"><strong>Motivo Saída:</strong> ${exp.motivo_saida}</p>
                        </div>
                    `).join('')
                }
            </section>

            <section class="space-y-6 text-base mb-10">
                <h3 class="text-xl font-bold text-white bg-blue-900 px-4 py-2 mb-6 uppercase tracking-widest rounded-sm">Informações Adicionais</h3>
                <div class="grid grid-cols-1 gap-8">
                    <div class="p-4 bg-gray-50 rounded-md border-t-2 border-blue-900">
                        <h4 class="font-bold text-blue-900 uppercase text-sm mb-3">Motivação</h4>
                        <p class="text-gray-800 leading-relaxed italic font-light">${c.motivacao}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-md border-t-2 border-blue-900">
                        <h4 class="font-bold text-blue-900 uppercase text-sm mb-3">Dificuldade Interpessoal</h4>
                        <p class="text-gray-800 leading-relaxed italic font-light">${c.dificuldade_interpessoal}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-md border-t-2 border-blue-900">
                        <h4 class="font-bold text-blue-900 uppercase text-sm mb-3">Habilidades e Competências</h4>
                        <p class="text-gray-800 leading-relaxed italic font-light">${c.habilidades_competencias}</p>
                    </div>
                </div>
            </section>

            <footer class="text-center text-xs text-gray-400 mt-16 border-t pt-6 italic">
                Documento oficial gerado eletronicamente em ${new Date().toLocaleString()} | Bramarlog Logística & Transportes
            </footer>
        </div>

        <div class="mt-8 border-t pt-4">
            <h4 class="font-bold text-gray-700 mb-2">Alterar Status:</h4>
            <div class="flex space-x-4">
                <button onclick="updateStatus(${c.id}, 'Aprovado')" class="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">Aprovar</button>
                <button onclick="updateStatus(${c.id}, 'Reprovado')" class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600">Reprovar</button>
                <button onclick="updateStatus(${c.id}, 'Em Análise')" class="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600">Em Análise</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

async function printCandidatePDF() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('pdf-container');
    
    // Configurações para melhor qualidade e centralização
    const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10; // 10mm de margem em todos os lados
    const contentWidth = pageWidth - (2 * margin);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;
    
    // Aumentar ligeiramente a altura da página útil para evitar cortes abruptos
    const pageVisibleHeight = pageHeight - (2 * margin);
    
    let heightLeft = contentHeight;
    let position = 0;
    let pageNum = 1;

    // Primeira página
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
    heightLeft -= pageVisibleHeight;

    // Páginas adicionais se necessário
    while (heightLeft > 0) {
        pdf.addPage();
        position = -(pageNum * pageVisibleHeight) + margin;
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        heightLeft -= pageVisibleHeight;
        pageNum++;
    }
    
    pdf.save(`curriculo_${currentCandidato.nome_completo.replace(/\s+/g, '_')}.pdf`);
}

// Iniciar
loadCandidatos();
