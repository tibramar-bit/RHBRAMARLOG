-- =====================================================
-- SETUP DO BANCO DE DADOS – Formulário de Vivência CAD
-- =====================================================

CREATE TABLE IF NOT EXISTS formularios_vivencia (
  id                        BIGSERIAL PRIMARY KEY,
  nome_candidato            TEXT NOT NULL,
  vaga                      TEXT NOT NULL,
  data_vivencia             DATE NOT NULL,
  horario                   TEXT NOT NULL,
  distancia_residencia      TEXT NOT NULL,
  tempo_deslocamento        TEXT NOT NULL,
  meio_transporte           TEXT NOT NULL,
  hora_saida                TEXT NOT NULL,
  hora_chegada              TEXT NOT NULL,
  rotina_viavel             TEXT NOT NULL,
  rotina_duvidas_explicacao TEXT,
  percepcao_demanda         TEXT NOT NULL,
  realidade_alinhada        TEXT NOT NULL,
  realidade_explicacao      TEXT,
  identificacao_ritmo       TEXT NOT NULL,
  sentimento_equipe         TEXT NOT NULL,
  imagina_trabalhando       TEXT NOT NULL,
  salario_expectativas      TEXT NOT NULL,
  desejo_seguir             TEXT NOT NULL,
  oportunidade_sentido      TEXT NOT NULL,
  comentario_final          TEXT,
  assinatura                TEXT NOT NULL,
  data_assinatura           DATE NOT NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE formularios_vivencia ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'formularios_vivencia'
    AND policyname = 'Permitir insert publico'
  ) THEN
    CREATE POLICY "Permitir insert publico"
      ON formularios_vivencia FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'formularios_vivencia'
    AND policyname = 'Permitir select publico'
  ) THEN
    CREATE POLICY "Permitir select publico"
      ON formularios_vivencia FOR SELECT TO anon USING (true);
  END IF;
END $$;
