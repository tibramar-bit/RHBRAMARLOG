// Configuração Supabase
const SUPABASE_URL = 'https://qefixlmqxlppblfablnf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ezBVjQjOIjBmzjK_CE2tLg_8iDMFBG_'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recruitment-form');
    const container = document.getElementById('experiencias-container');
    const addBtn = document.getElementById('add-experiencia');
    const primeiroEmpregoCheckbox = document.getElementById('primeiro_emprego');
    let experienciaCount = 0;

    // Adiciona as 3 experiências fixas iniciais
    for (let i = 0; i < 3; i++) {
        addExperienciaField();
    }

    // Função para adicionar campos de experiência
    function addExperienciaField() {
        experienciaCount++;
        const card = document.createElement('div');
        card.className = 'experiencia-card bg-gray-50 p-4 border rounded-lg relative';
        card.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium">Empresa *</label>
                    <input type="text" name="empresa_${experienciaCount}" required class="mt-1 block w-full border p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium">Telefone da Empresa *</label>
                    <input type="tel" name="telefone_empresa_${experienciaCount}" required class="mt-1 block w-full border p-2" placeholder="(00) 0000-0000">
                </div>
                <div>
                    <label class="block text-sm font-medium">Cargo *</label>
                    <input type="text" name="cargo_${experienciaCount}" required class="mt-1 block w-full border p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium">Período</label>
                    <input type="text" name="periodo_${experienciaCount}" class="mt-1 block w-full border p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium">Área</label>
                    <input type="text" name="area_${experienciaCount}" class="mt-1 block w-full border p-2">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Atividade</label>
                    <textarea name="atividade_${experienciaCount}" class="mt-1 block w-full border p-2 h-20"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium">Último Salário (R$)</label>
                    <input type="text" name="salario_${experienciaCount}" class="mt-1 block w-full border p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium">Benefícios</label>
                    <div class="mt-2 flex space-x-2">
                        <label><input type="checkbox" name="beneficios_${experienciaCount}" value="Vale Alimentação"> VA</label>
                        <label><input type="checkbox" name="beneficios_${experienciaCount}" value="Vale Refeição"> VR</label>
                        <label><input type="checkbox" name="beneficios_${experienciaCount}" value="Vale Transporte"> VT</label>
                    </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Motivo da Saída</label>
                    <input type="text" name="motivo_saida_${experienciaCount}" class="mt-1 block w-full border p-2">
                </div>
            </div>
            ${experienciaCount > 3 ? '<button type="button" class="remove-exp absolute top-2 right-2 text-red-500 font-bold">X</button>' : ''}
        `;
        container.appendChild(card);

        if (experienciaCount > 3) {
            card.querySelector('.remove-exp').addEventListener('click', () => {
                card.remove();
            });
        }
    }

    addBtn.addEventListener('click', () => {
        addExperienciaField();
    });

    primeiroEmpregoCheckbox.addEventListener('change', (e) => {
        const inputs = container.querySelectorAll('input, textarea, select');
        if (e.target.checked) {
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
            inputs.forEach(input => input.value = '');
        } else {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const requiredFields = form.querySelectorAll('[required]');
        let valid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                valid = false;
                field.classList.add('border-red-500');
            } else {
                field.classList.remove('border-red-500');
            }
        });

        if (!valid) {
            alert('Por favor, preencha todos os campos obrigatórios (*)');
            return;
        }

        const formData = new FormData(form);
        const data = {
            nome_completo: formData.get('nome_completo'),
            idade: parseInt(formData.get('idade')),
            forma_recrutamento: formData.get('forma_recrutamento'),
            indicacao_de: formData.get('indicacao_de'),
            cargo_pretendido: formData.get('cargo_pretendido'),
            tem_transporte: formData.get('tem_transporte'),
            qual_transporte: formData.get('qual_transporte'),
            reside_em: formData.get('reside_em'),
            naturalidade: formData.get('naturalidade'),
            estado_civil: formData.get('estado_civil'),
            quantidade_filhos: parseInt(formData.get('quantidade_filhos')),
            escolaridade: JSON.stringify({
                fundamental: formData.get('escolaridade_2grau') === 'on',
                inst_2grau: formData.get('inst_2grau'),
                periodo_2grau: formData.get('periodo_2grau'),
                tecnico: formData.get('escolaridade_tecnico') === 'on',
                qual_tecnico: formData.get('qual_tecnico'),
                tecnico_status: formData.get('tecnico_status'),
                periodo_tecnico: formData.get('periodo_tecnico'),
                superior_status: formData.get('superior_status'),
                inst_superior: formData.get('inst_superior'),
                curso_superior: formData.get('curso_superior'),
                periodo_superior: formData.get('periodo_superior'),
                outros: formData.get('outros_cursos')
            }),
            idiomas: JSON.stringify(() => {
                const selecionados = [];
                const checkboxes = form.querySelectorAll('input[name="idioma_escolhido"]:checked');
                checkboxes.forEach(cb => {
                    const idioma = cb.value;
                    let nivel = '';
                    if (idioma === 'Inglês') nivel = formData.get('nivel_ingles');
                    else if (idioma === 'Espanhol') nivel = formData.get('nivel_espanhol');
                    else if (idioma === 'Francês') nivel = formData.get('nivel_frances');
                    else if (idioma === 'Alemão') nivel = formData.get('nivel_alemao');
                    else if (idioma === 'Italiano') nivel = formData.get('nivel_italiano');
                    else if (idioma === 'Japonês') nivel = formData.get('nivel_japones');
                    else if (idioma === 'Mandarim') nivel = formData.get('nivel_mandarim');
                    else if (idioma === 'Hindi') nivel = formData.get('nivel_hindi');
                    else if (idioma === 'Árabe') nivel = formData.get('nivel_arabe');
                    else if (idioma === 'Russo') nivel = formData.get('nivel_russo');
                    else if (idioma === 'Português') nivel = formData.get('nivel_portugues');
                    else if (idioma === 'Outro') {
                        const nome = formData.get('outro_idioma_nome');
                        const lvl = formData.get('nivel_outro');
                        selecionados.push({ idioma: nome || 'Outro', nivel: lvl });
                        return;
                    }
                    selecionados.push({ idioma, nivel });
                });
                return selecionados;
            })(),
            informatica: formData.get('informatica'),
            experiencia_fora_pais: formData.get('experiencia_exterior'),
            quais_paises: formData.get('quais_paises'),
            primeiro_emprego: formData.get('primeiro_emprego') === 'on',
            experiencias: [],
            motivacao: formData.get('motivacao'),
            dificuldade_interpessoal: formData.get('dificuldade_interpessoal'),
            habilidades_competencias: formData.get('habilidades_competencias'),
            pretensao_salarial: formData.get('pretensao_salarial')
        };

        if (!data.primeiro_emprego) {
            const cards = container.querySelectorAll('.experiencia-card');
            cards.forEach((card, index) => {
                const empresa = card.querySelector(`input[name^="empresa_"]`).value;
                if (empresa) {
                    data.experiencias.push({
                        empresa: empresa,
                        telefone_empresa: card.querySelector(`input[name^="telefone_empresa_"]`).value,
                        cargo: card.querySelector(`input[name^="cargo_"]`).value,
                        periodo: card.querySelector(`input[name^="periodo_"]`).value,
                        area: card.querySelector(`input[name^="area_"]`).value,
                        atividade: card.querySelector(`textarea[name^="atividade_"]`).value,
                        salario: card.querySelector(`input[name^="salario_"]`).value,
                        beneficios: Array.from(card.querySelectorAll(`input[name^="beneficios_"]:checked`)).map(cb => cb.value),
                        motivo_saida: card.querySelector(`input[name^="motivo_saida_"]`).value
                    });
                }
            });
        }
        data.experiencias = JSON.stringify(data.experiencias);

        try {
            const { error } = await supabaseClient
                .from('candidatos')
                .insert([data]);

            if (error) throw error;

            alert('Candidatura enviada com sucesso! Boa sorte!');
            form.reset();
            window.location.reload();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao enviar candidatura: ' + error.message);
        }
    });
});
