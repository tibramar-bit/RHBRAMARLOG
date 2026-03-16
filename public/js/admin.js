let currentCandidato = null;

async function loadCandidatos() {
    try {
        const response = await fetch('/api/candidatos');
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        const data = await response.json();
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
                    <button onclick='viewCandidato(${JSON.stringify(c)})' class="text-blue-600 hover:text-blue-800 font-medium">Ver/Editar</button>
                    <button onclick='deleteCandidato(${c.id})' class="text-red-600 hover:text-red-800 font-medium">Apagar</button>
                </td>
            `;
            list.appendChild(row);
        });
    } catch (err) {
        console.error('Erro ao carregar candidatos:', err);
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
        const response = await fetch(`/api/candidatos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            loadCandidatos();
            closeModal();
        }
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
    }
}

async function deleteCandidato(id) {
    if (confirm('Tem certeza que deseja apagar este candidato?')) {
        try {
            const response = await fetch(`/api/candidatos/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadCandidatos();
            }
        } catch (err) {
            console.error('Erro ao apagar candidato:', err);
        }
    }
}

function viewCandidato(c) {
    currentCandidato = c;
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    
    // Parse JSON data
    const escolaridade = JSON.parse(c.escolaridade || '{}');
    const idiomas = JSON.parse(c.idiomas || '{}');
    const experiencias = JSON.parse(c.experiencias || '[]');

    content.innerHTML = `
        <div id="pdf-container" class="space-y-6">
            <header class="text-center border-b pb-4">
                <h1 class="text-3xl font-bold text-blue-900">Currículo de Recrutamento</h1>
                <p class="text-gray-500">Enviado em: ${new Date(c.data_envio).toLocaleString()}</p>
            </header>

            <section class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                    <p><strong>Nome:</strong> ${c.nome_completo}</p>
                    <p><strong>Idade:</strong> ${c.idade}</p>
                    <p><strong>Cargo Pretendido:</strong> ${c.cargo_pretendido}</p>
                    <p><strong>Forma Recrutamento:</strong> ${c.forma_recrutamento || '-'}</p>
                    <p><strong>Indicação:</strong> ${c.indicacao_de || '-'}</p>
                    <p><strong>Transporte:</strong> ${c.tem_transporte || '-'}</p>
                </div>
                <div class="space-y-1">
                    <p><strong>Reside em:</strong> ${c.reside_em || '-'}</p>
                    <p><strong>Naturalidade:</strong> ${c.naturalidade}</p>
                    <p><strong>Estado Civil:</strong> ${c.estado_civil}</p>
                    <p><strong>Qtd Filhos:</strong> ${c.quantidade_filhos}</p>
                    <p><strong>Pretensão Salarial:</strong> ${c.pretensao_salarial}</p>
                </div>
            </section>

            <section>
                <h3 class="text-xl font-bold text-blue-800 border-b pb-1 mb-2">Formação Educacional</h3>
                <div class="grid grid-cols-2 gap-4">
                    <p><strong>Escolaridade:</strong> ${escolaridade.fundamental ? '2º Grau' : ''} ${escolaridade.tecnico ? '/ Técnico' : ''}</p>
                    <p><strong>Superior:</strong> ${escolaridade.superior_status || '-'} (${escolaridade.inst_superior || '-'})</p>
                    <p class="col-span-2"><strong>Outros:</strong> ${escolaridade.outros || '-'}</p>
                    <p><strong>Idiomas:</strong> ${idiomas.ingles_nivel || 'Não possui'}</p>
                    <p><strong>Informática:</strong> ${c.informatica || '-'}</p>
                    <p><strong>Experiência Exterior:</strong> ${c.experiencia_fora_pais || '-'} ${c.quais_paises ? '(' + c.quais_paises + ')' : ''}</p>
                </div>
            </section>

            <section>
                <h3 class="text-xl font-bold text-blue-800 border-b pb-1 mb-2">Experiências Profissionais</h3>
                ${c.primeiro_emprego ? '<p class="italic text-gray-600">Este é o meu primeiro emprego.</p>' : 
                    experiencias.map((exp, idx) => `
                        <div class="mb-4 p-3 bg-gray-50 rounded border">
                            <p class="font-bold text-lg">${idx + 1}. ${exp.empresa} - ${exp.cargo}</p>
                            <p class="text-sm"><strong>Período:</strong> ${exp.periodo} | <strong>Área:</strong> ${exp.area}</p>
                            <p class="text-sm mt-1"><strong>Atividade:</strong> ${exp.atividade}</p>
                            <p class="text-sm"><strong>Salário:</strong> ${exp.salario} | <strong>Benefícios:</strong> ${exp.beneficios.join(', ')}</p>
                            <p class="text-sm"><strong>Motivo Saída:</strong> ${exp.motivo_saida}</p>
                        </div>
                    `).join('')
                }
            </section>

            <section class="space-y-4">
                <div>
                    <h4 class="font-bold text-blue-800">Motivação</h4>
                    <p class="bg-gray-50 p-2 border rounded">${c.motivacao}</p>
                </div>
                <div>
                    <h4 class="font-bold text-blue-800">Dificuldade Interpessoal</h4>
                    <p class="bg-gray-50 p-2 border rounded">${c.dificuldade_interpessoal}</p>
                </div>
                <div>
                    <h4 class="font-bold text-blue-800">Habilidades e Competências</h4>
                    <p class="bg-gray-50 p-2 border rounded">${c.habilidades_competencias}</p>
                </div>
            </section>
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
    
    // Configurar o PDF para não cortar conteúdo
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; 
    const pageHeight = 295;  
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }
    
    pdf.save(`curriculo_${currentCandidato.nome_completo.replace(/\s+/g, '_')}.pdf`);
}

// Iniciar
loadCandidatos();
