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
            #pdf-container { width: 800px; padding: 40px; margin: 0 auto; background-color: white; }
            #pdf-container section { margin-bottom: 30px; }
            .pdf-title-box { background-color: #1e3a8a !important; color: white !important; padding: 10px 20px; margin-bottom: 20px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 18px; }
            .info-grid { display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; }
            .info-col { flex: 1; min-width: 300px; }
            .info-item { border-bottom: 1px solid #f3f4f6; padding: 10px 0; margin-bottom: 5px; }
            .exp-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; background-color: #ffffff; }
            .add-info-box { background-color: #f9fafb; border-top: 3px solid #1e3a8a; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
            .label-bold { font-weight: bold; color: #1e3a8a; }
        </style>
        <div id="pdf-container">
            <header style="text-align: center; border-bottom: 5px solid #1e3a8a; padding-bottom: 30px; margin-bottom: 40px;">
                <img src="img/logo.jpg" alt="Logo Bramarlog" onerror="this.style.display='none'" style="width: 180px; margin: 0 auto 20px; display: block;">
                <h1 style="font-size: 36px; font-weight: 800; color: #1e3a8a; margin: 0; letter-spacing: -1px;">CURRÍCULO DE RECRUTAMENTO</h1>
                <p style="color: #4b5563; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">Bramarlog Logística & Transportes</p>
            </header>

            <section class="info-grid">
                <div class="info-col">
                    <p class="info-item"><span class="label-bold">Nome:</span> ${c.nome_completo}</p>
                    <p class="info-item"><span class="label-bold">Idade:</span> ${c.idade} anos</p>
                    <p class="info-item"><span class="label-bold">Cargo Pretendido:</span> ${c.cargo_pretendido}</p>
                    <p class="info-item"><span class="label-bold">Forma Recrutamento:</span> ${c.forma_recrutamento || '-'}</p>
                    <p class="info-item"><span class="label-bold">Indicação:</span> ${c.indicacao_de || '-'}</p>
                </div>
                <div class="info-col">
                    <p class="info-item"><span class="label-bold">Reside em:</span> ${c.reside_em || '-'}</p>
                    <p class="info-item"><span class="label-bold">Naturalidade:</span> ${c.naturalidade}</p>
                    <p class="info-item"><span class="label-bold">Estado Civil:</span> ${c.estado_civil}</p>
                    <p class="info-item"><span class="label-bold">Qtd Filhos:</span> ${c.quantidade_filhos}</p>
                    <p class="info-item"><span class="label-bold">Pretensão Salarial:</span> ${c.pretensao_salarial}</p>
                </div>
                <div style="width: 100%; border-bottom: 1px solid #f3f4f6; padding: 10px 0;">
                    <p><span class="label-bold">Transporte:</span> ${c.tem_transporte || '-'}</p>
                </div>
            </section>

            <section>
                <h3 class="pdf-title-box">Formação Educacional</h3>
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${escolaridade.fundamental ? `
                        <div style="padding: 20px; background-color: #f9fafb; border-left: 5px solid #1e3a8a; border-radius: 6px;">
                            <p><span class="label-bold">Ensino Médio:</span> ${escolaridade.inst_2grau || '-'} (${escolaridade.periodo_2grau || '-'})</p>
                        </div>
                    ` : ''}
                    ${escolaridade.tecnico ? `
                        <div style="padding: 20px; background-color: #f9fafb; border-left: 5px solid #1e3a8a; border-radius: 6px;">
                            <p><span class="label-bold">Técnico:</span> ${escolaridade.qual_tecnico || '-'} - ${escolaridade.tecnico_status || '-'} (${escolaridade.periodo_tecnico || '-'})</p>
                        </div>
                    ` : ''}
                    ${escolaridade.superior_status ? `
                        <div style="padding: 20px; background-color: #f9fafb; border-left: 5px solid #1e3a8a; border-radius: 6px;">
                            <p><span class="label-bold">Ensino Superior:</span> ${escolaridade.curso_superior || '-'} - ${escolaridade.superior_status || '-'} (${escolaridade.inst_superior || '-'}) | Período: ${escolaridade.periodo_superior || '-'}</p>
                        </div>
                    ` : ''}
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 10px; font-size: 15px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <p><span class="label-bold">Outros Cursos:</span> ${escolaridade.outros || '-'}</p>
                        <p><span class="label-bold">Idiomas:</span> ${Array.isArray(idiomas) && idiomas.length > 0 ? idiomas.map(i => `${i.idioma} (${i.nivel || 'N/I'})`).join(', ') : 'Não possui'}</p>
                        <p><span class="label-bold">Informática:</span> ${c.informatica || '-'}</p>
                        <p><span class="label-bold">Exp. Exterior:</span> ${c.experiencia_fora_pais || '-'} ${c.quais_paises ? '(' + c.quais_paises + ')' : ''}</p>
                    </div>
                </div>
            </section>

            <section>
                <h3 class="pdf-title-box">Experiências Profissionais</h3>
                ${c.primeiro_emprego ? '<p style="font-style: italic; color: #6b7280; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db;">Este é o meu primeiro emprego.</p>' : 
                    experiencias.map((exp, idx) => `
                        <div class="exp-card">
                            <p style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">${idx + 1}. ${exp.empresa} - ${exp.cargo}</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 15px; color: #374151; margin-bottom: 20px;">
                                <p><span class="label-bold">Telefone:</span> ${exp.telefone_empresa || '-'}</p>
                                <p><span class="label-bold">Período:</span> ${exp.periodo}</p>
                                <p><span class="label-bold">Área:</span> ${exp.area}</p>
                                <p><span class="label-bold">Salário:</span> ${exp.salario}</p>
                                <p style="grid-column: span 2;"><span class="label-bold">Benefícios:</span> ${exp.beneficios.join(', ')}</p>
                            </div>
                            <div style="margin-top: 15px; padding: 15px; background-color: #fcfcfc; border-radius: 4px; border: 1px solid #f3f4f6;">
                                <p style="margin-bottom: 10px; color: #111827; line-height: 1.6;"><span class="label-bold">Atividade:</span> ${exp.atividade}</p>
                                <p style="color: #111827;"><span class="label-bold">Motivo Saída:</span> ${exp.motivo_saida}</p>
                            </div>
                        </div>
                    `).join('')
                }
            </section>

            <section>
                <h3 class="pdf-title-box">Informações Adicionais</h3>
                <div class="add-info-box">
                    <h4 class="label-bold" style="text-transform: uppercase; font-size: 15px; margin-bottom: 10px;">Motivação</h4>
                    <p style="color: #1f2937; line-height: 1.7; font-style: italic; font-size: 15px;">${c.motivacao}</p>
                </div>
                <div class="add-info-box">
                    <h4 class="label-bold" style="text-transform: uppercase; font-size: 15px; margin-bottom: 10px;">Dificuldade Interpessoal</h4>
                    <p style="color: #1f2937; line-height: 1.7; font-style: italic; font-size: 15px;">${c.dificuldade_interpessoal}</p>
                </div>
                <div class="add-info-box">
                    <h4 class="label-bold" style="text-transform: uppercase; font-size: 15px; margin-bottom: 10px;">Habilidades e Competências</h4>
                    <p style="color: #1f2937; line-height: 1.7; font-style: italic; font-size: 15px;">${c.habilidades_competencias}</p>
                </div>
            </section>

            <footer style="text-align: center; font-size: 14px; color: #6b7280; margin-top: 60px; border-top: 2px solid #e5e7eb; padding-top: 30px; font-style: italic;">
                Documento gerado automaticamente pelo sistema de recrutamento Bramarlog em ${new Date().toLocaleString()}
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
    
    // Configurações para captura de imagem de alta fidelidade
    const canvas = await html2canvas(element, { 
        scale: 3, // Aumenta a resolução para evitar serrilhado nas letras
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800 // Garante que a largura seja consistente com o CSS
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0); // Usar JPEG com qualidade máxima
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Largura útil da imagem no PDF (com margens de 10mm)
    const margin = 10;
    const imgWidthInPdf = pdfWidth - (2 * margin);
    const imgHeightInPdf = (canvas.height * imgWidthInPdf) / canvas.width;
    
    let heightLeft = imgHeightInPdf;
    let position = 0;
    let pageNum = 0;

    // Adiciona as páginas fatiando a imagem
    while (heightLeft > 0) {
        if (pageNum > 0) pdf.addPage();
        
        // O pulo do gato: calcular a posição Y negativa para mostrar a "fatia" correta
        // Adicionamos a margem no topo da primeira página e compensamos nas seguintes
        const yOffset = margin - (pageNum * (pdfHeight - 2 * margin));
        
        pdf.addImage(imgData, 'JPEG', margin, yOffset, imgWidthInPdf, imgHeightInPdf);
        
        heightLeft -= (pdfHeight - 2 * margin);
        pageNum++;
    }
    
    pdf.save(`curriculo_${currentCandidato.nome_completo.replace(/\s+/g, '_')}.pdf`);
}

// Iniciar
loadCandidatos();
