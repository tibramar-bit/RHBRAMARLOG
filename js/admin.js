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
        <style>
            #pdf-container { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; box-sizing: border-box; }
            #pdf-container section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px; }
            .pdf-title-box { background-color: #1e3a8a !important; color: white !important; -webkit-print-color-adjust: exact; padding: 8px 16px; margin-bottom: 16px; border-radius: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 14px; }
            .info-item { border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 8px; }
            .exp-card { border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; margin-bottom: 16px; background-color: white; }
            .add-info-box { background-color: #f9fafb; border-top: 2px solid #1e3a8a; padding: 16px; border-radius: 4px; margin-bottom: 16px; }
        </style>
        <div id="pdf-container" class="bg-white">
            <header style="text-align: center; border-bottom: 4px solid #1e3a8a; padding-bottom: 24px; margin-bottom: 40px;">
                <img src="img/logo.jpg" alt="Logo Bramarlog" onerror="this.style.display='none'" style="width: 160px; margin: 0 auto 24px;">
                <h1 style="font-size: 32px; font-weight: 800; color: #1e3a8a; margin: 0;">CURRÍCULO DE RECRUTAMENTO</h1>
                <p style="color: #4b5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px;">Bramarlog Logística</p>
            </header>

            <section class="info-grid" style="margin-bottom: 40px;">
                <div>
                    <p class="info-item"><strong>Nome:</strong> ${c.nome_completo}</p>
                    <p class="info-item"><strong>Idade:</strong> ${c.idade} anos</p>
                    <p class="info-item"><strong>Cargo Pretendido:</strong> ${c.cargo_pretendido}</p>
                    <p class="info-item"><strong>Forma Recrutamento:</strong> ${c.forma_recrutamento || '-'}</p>
                    <p class="info-item"><strong>Indicação:</strong> ${c.indicacao_de || '-'}</p>
                </div>
                <div>
                    <p class="info-item"><strong>Reside em:</strong> ${c.reside_em || '-'}</p>
                    <p class="info-item"><strong>Naturalidade:</strong> ${c.naturalidade}</p>
                    <p class="info-item"><strong>Estado Civil:</strong> ${c.estado_civil}</p>
                    <p class="info-item"><strong>Qtd Filhos:</strong> ${c.quantidade_filhos}</p>
                    <p class="info-item"><strong>Pretensão Salarial:</strong> ${c.pretensao_salarial}</p>
                </div>
                <div style="grid-column: span 2; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                    <p><strong>Transporte:</strong> ${c.tem_transporte || '-'}</p>
                </div>
            </section>

            <section>
                <h3 class="pdf-title-box">FORMAÇÃO EDUCACIONAL</h3>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${escolaridade.fundamental ? `
                        <div style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #1e3a8a; border-radius: 4px;">
                            <p><strong>2º Grau:</strong> ${escolaridade.inst_2grau || '-'} (${escolaridade.periodo_2grau || '-'})</p>
                        </div>
                    ` : ''}
                    ${escolaridade.tecnico ? `
                        <div style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #1e3a8a; border-radius: 4px;">
                            <p><strong>Técnico:</strong> ${escolaridade.qual_tecnico || '-'} - ${escolaridade.tecnico_status || '-'} (${escolaridade.periodo_tecnico || '-'})</p>
                        </div>
                    ` : ''}
                    ${escolaridade.superior_status ? `
                        <div style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #1e3a8a; border-radius: 4px;">
                            <p><strong>Superior:</strong> ${escolaridade.curso_superior || '-'} - ${escolaridade.superior_status || '-'} (${escolaridade.inst_superior || '-'}) | Período: ${escolaridade.periodo_superior || '-'}</p>
                        </div>
                    ` : ''}
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 8px; font-size: 14px;">
                        <p><strong>Outros:</strong> ${escolaridade.outros || '-'}</p>
                        <p><strong>Idiomas:</strong> ${Array.isArray(idiomas) && idiomas.length > 0 ? idiomas.map(i => `${i.idioma} (${i.nivel || 'N/I'})`).join(', ') : 'Não possui'}</p>
                        <p><strong>Informática:</strong> ${c.informatica || '-'}</p>
                        <p><strong>Exp. Exterior:</strong> ${c.experiencia_fora_pais || '-'} ${c.quais_paises ? '(' + c.quais_paises + ')' : ''}</p>
                    </div>
                </div>
            </section>

            <section>
                <h3 class="pdf-title-box">EXPERIÊNCIAS PROFISSIONAIS</h3>
                ${c.primeiro_emprego ? '<p style="font-style: italic; color: #4b5563; padding: 16px; background-color: #f9fafb; border-radius: 4px;">Este é o meu primeiro emprego.</p>' : 
                    experiencias.map((exp, idx) => `
                        <div class="exp-card">
                            <p style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 18px; margin-bottom: 8px;">${idx + 1}. ${exp.empresa} - ${exp.cargo}</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; color: #4b5563; margin-bottom: 12px;">
                                <p><strong>Telefone:</strong> ${exp.telefone_empresa || '-'}</p>
                                <p><strong>Período:</strong> ${exp.periodo}</p>
                                <p><strong>Área:</strong> ${exp.area}</p>
                                <p><strong>Salário:</strong> ${exp.salario}</p>
                                <p><strong>Benefícios:</strong> ${exp.beneficios.join(', ')}</p>
                            </div>
                            <p style="margin-top: 8px; color: #1f2937; line-height: 1.5;"><strong>Atividade:</strong> ${exp.atividade}</p>
                            <p style="margin-top: 8px; color: #1f2937;"><strong>Motivo Saída:</strong> ${exp.motivo_saida}</p>
                        </div>
                    `).join('')
                }
            </section>

            <section>
                <h3 class="pdf-title-box">INFORMAÇÕES ADICIONAIS</h3>
                <div class="add-info-box">
                    <h4 style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 14px; margin-bottom: 8px;">Motivação</h4>
                    <p style="color: #1f2937; line-height: 1.6; font-style: italic;">${c.motivacao}</p>
                </div>
                <div class="add-info-box">
                    <h4 style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 14px; margin-bottom: 8px;">Dificuldade Interpessoal</h4>
                    <p style="color: #1f2937; line-height: 1.6; font-style: italic;">${c.dificuldade_interpessoal}</p>
                </div>
                <div class="add-info-box">
                    <h4 style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 14px; margin-bottom: 8px;">Habilidades e Competências</h4>
                    <p style="color: #1f2937; line-height: 1.6; font-style: italic;">${c.habilidades_competencias}</p>
                </div>
            </section>

            <footer style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 24px; font-style: italic;">
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
    
    // Mostra o container se estiver escondido (no caso de modais)
    const originalStyle = element.style.display;
    element.style.display = 'block';

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    try {
        await pdf.html(element, {
            callback: function (doc) {
                doc.save(`curriculo_${currentCandidato.nome_completo.replace(/\s+/g, '_')}.pdf`);
                element.style.display = originalStyle;
            },
            x: 0,
            y: 0,
            width: 210, // Largura A4 em mm
            windowWidth: 800, // Largura da janela virtual para renderização
            autoPaging: 'text', // Tenta quebrar a página sem cortar texto
            margin: [10, 10, 10, 10] // Margens [top, left, bottom, right]
        });
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente usar a função de imprimir do navegador (Ctrl+P).');
        element.style.display = originalStyle;
    }
}

// Iniciar
loadCandidatos();
