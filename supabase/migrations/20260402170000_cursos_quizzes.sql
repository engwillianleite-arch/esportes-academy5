-- Story 16.3 - quizzes, avaliacoes e criterios de aprovacao

CREATE TABLE curso_quizzes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id          uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  modulo_id         uuid REFERENCES curso_modulos(id) ON DELETE CASCADE,
  aula_id           uuid REFERENCES curso_aulas(id) ON DELETE CASCADE,
  tipo              text NOT NULL CHECK (tipo IN ('aula', 'modulo', 'curso_final')),
  titulo            text NOT NULL,
  descricao         text,
  nota_minima       numeric(5,2) NOT NULL DEFAULT 70 CHECK (nota_minima >= 0 AND nota_minima <= 100),
  tentativas_max    integer NOT NULL DEFAULT 1 CHECK (tentativas_max >= 1),
  published         boolean NOT NULL DEFAULT true,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER handle_updated_at_curso_quizzes
  BEFORE UPDATE ON curso_quizzes
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX curso_quizzes_curso_idx
  ON curso_quizzes (curso_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE curso_quiz_perguntas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid NOT NULL REFERENCES curso_quizzes(id) ON DELETE CASCADE,
  enunciado         text NOT NULL,
  ordem             integer NOT NULL CHECK (ordem >= 1),
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, ordem)
);

CREATE TRIGGER handle_updated_at_curso_quiz_perguntas
  BEFORE UPDATE ON curso_quiz_perguntas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TABLE curso_quiz_alternativas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta_id       uuid NOT NULL REFERENCES curso_quiz_perguntas(id) ON DELETE CASCADE,
  texto             text NOT NULL,
  ordem             integer NOT NULL CHECK (ordem >= 1),
  correta           boolean NOT NULL DEFAULT false,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pergunta_id, ordem)
);

CREATE TRIGGER handle_updated_at_curso_quiz_alternativas
  BEFORE UPDATE ON curso_quiz_alternativas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TABLE curso_quiz_tentativas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid NOT NULL REFERENCES curso_quizzes(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tentativa_numero  integer NOT NULL CHECK (tentativa_numero >= 1),
  nota              numeric(5,2) NOT NULL DEFAULT 0 CHECK (nota >= 0 AND nota <= 100),
  aprovado          boolean NOT NULL DEFAULT false,
  respostas         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, user_id, tentativa_numero)
);

CREATE TRIGGER handle_updated_at_curso_quiz_tentativas
  BEFORE UPDATE ON curso_quiz_tentativas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE curso_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_quiz_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_quiz_alternativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE curso_quiz_tentativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curso_quizzes_select_escola" ON curso_quizzes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_quizzes.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quizzes_write_escola" ON curso_quizzes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_quizzes.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quizzes_update_escola" ON curso_quizzes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_quizzes.curso_id
        AND c.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cursos c
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE c.id = curso_quizzes.curso_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quiz_perguntas_select_escola" ON curso_quiz_perguntas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM curso_quizzes q
      JOIN cursos c ON c.id = q.curso_id
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE q.id = curso_quiz_perguntas.quiz_id
        AND q.deleted_at IS NULL
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quiz_perguntas_write_escola" ON curso_quiz_perguntas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM curso_quizzes q
      JOIN cursos c ON c.id = q.curso_id
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE q.id = curso_quiz_perguntas.quiz_id
        AND q.deleted_at IS NULL
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quiz_alternativas_select_escola" ON curso_quiz_alternativas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM curso_quiz_perguntas p
      JOIN curso_quizzes q ON q.id = p.quiz_id
      JOIN cursos c ON c.id = q.curso_id
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE p.id = curso_quiz_alternativas.pergunta_id
        AND p.deleted_at IS NULL
        AND q.deleted_at IS NULL
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quiz_alternativas_write_escola" ON curso_quiz_alternativas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM curso_quiz_perguntas p
      JOIN curso_quizzes q ON q.id = p.quiz_id
      JOIN cursos c ON c.id = q.curso_id
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.perfil IN ('admin_escola', 'coordenador')
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE p.id = curso_quiz_alternativas.pergunta_id
        AND p.deleted_at IS NULL
        AND q.deleted_at IS NULL
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quiz_tentativas_select_own_or_escola" ON curso_quiz_tentativas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM curso_quizzes q
      JOIN cursos c ON c.id = q.curso_id
      JOIN escola_usuarios eu
        ON eu.escola_id = c.escola_id
       AND eu.user_id = auth.uid()
       AND eu.ativo = true
       AND eu.deleted_at IS NULL
      WHERE q.id = curso_quiz_tentativas.quiz_id
        AND q.deleted_at IS NULL
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "curso_quiz_tentativas_insert_own" ON curso_quiz_tentativas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
