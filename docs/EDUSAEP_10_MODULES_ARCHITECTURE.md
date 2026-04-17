# ARQUITETURA EDUSAEP - 10 MÓDULOS ESTRATÉGICOS

Este documento detalha o planejamento arquitetural elaborado para elevar o sistema EDUSAEP a um nível avançado de inteligência pedagógica, tomada de decisão e personalização institucional, preservando rigorosamente a regra de ouro: *simplicidade, protagonismo docente e foco educacional*.

---

## 1. Módulos Implementados / Propostos

### 🧠 MÓDULO 1 — OBSERVATÓRIO DO ALUNO
Centralização das informações de aprendizado individual.
*   **Camada de Dados**: Coleções `learning_profiles`, `exam_submissions`, `study_plans`.
*   **Lógica**: Agregação dos dados nos serviços (ex: `dashboardService.ts`).
*   **Visão**: Histórico de notas, competências dominadas e críticas.

### 📊 MÓDULO 2 — OBSERVATÓRIO DA TURMA
Visão macro para o professor.
*   **Camada de Dados**: Agregação sobre `users (role: aluno)`, cruzando com `activity_submissions` e `exam_submissions`.
*   **Lógica**: `dashboardService.getClassObservatoryData`. Identificação de alunos em risco (Média < 60, submissões < 70%).

### 🛠️ MÓDULO 3 — CENTRAL DE INTERVENÇÃO PEDAGÓGICA
Geração automática de rotas de correção e recuperação.
*   **Camada de Dados**: `recomendacoes_pedagogicas`, `intervencoes_pedagogicas`.
*   **Lógica**: `recommendationService.ts` e `pedagogicalEngine.ts`. Disparo de intervenções estruturadas para o docente.

### 🧠 MÓDULO 4 — ENGENHARIA DE ERRO
Categorização taxonômica do erro (Conceito, Interpretação, Atenção, Execução).
*   **Camada de Dados**: `cognitive_error_analyses` (Modelagem atrelada ao `submissionId`).
*   **Lógica**: Extração de padrões baseados na resposta do aluno cruzada com metadados das `questions`.

### 📈 MÓDULO 5 — PREDIÇÃO DE DESEMPENHO
Modelagem preditiva e motor de inferência de risco.
*   **Camada de Dados**: `performance_predictions`.
*   **Lógica**: `predictionService.ts`. Agrupa histórico longitudinal e prever tendência de queda (Slope calculation).

### 📚 MÓDULO 6 — BANCO INTELIGENTE DE QUESTÕES
Autonomia do banco de dados para qualificação dos itens.
*   **Camada de Dados**: `question_metrics` (adicionado ao Blueprint). Mede Discrimination Index ($D$), Difficulty Real ($P$).
*   **Lógica**: Tarefa assíncrona periódica ou acionada por `n8n` para atualizar as métricas das questões com base em grandes volumes de submissões.

### 🧩 MÓDULO 7 — TEMPLATES INSTITUCIONAIS
Arquitetura baseada em padronização.
*   **Camada de Dados**: `institutional_templates` (adicionado ao Blueprint). Define JSON Strings editáveis (Atividades, Simulados).
*   **Tipos**: `activity`, `rubric`, `simulado`, `feedback`.

### 📂 MÓDULO 8 — PORTFÓLIO POR EVIDÊNCIA
Acompanhamento documental histórico do processo evolutivo.
*   **Camada de Dados**: `evidence_portfolio` (adicionado ao Blueprint).
*   **Funcionalidades**: Associação de URLs, links externos, competências correlacionadas, timestamp inalterável.

### 🧭 MÓDULO 9 — MAPA DE COMPETÊNCIAS
Grafo de Radar e Heatmap de conhecimento estático vs dinâmico.
*   **Camada de Dados**: Uso agregado da taxonomia de `competencias` + scores em `learning_profiles`.
*   **Frontend**: Gráficos complexos com `recharts` em painéis customizados.

### 🧠 MÓDULO 10 — MOTOR PEDAGÓGICO CENTRAL
Tomada de decisão em back-stage agindo por demanda passiva/ativa.
*   **Componente**: `pedagogicalEngine.ts`. Orquestrador que processa performance, erros, entregas, e determina a geração de triggers (Alertas, IA Prompts).

---

## 2. Estrutura de Pastas (Implementação Limpa)
```text
src/
├── modules/
│   ├── observatory/        # Módulos 1 e 2
│   ├── intervention/       # Módulo 3
│   ├── engine/             # Módulos 4, 5 e 10
│   ├── questions/          # Módulo 6
│   ├── templates/          # Módulo 7
│   └── portfolio/          # Módulos 8 e 9
├── services/               # Serviços Firebase legacy e APIs Core
├── components/             # Views baseadas em Componentização
└── routes/
```

## 3. Segurança & Performance
- **RBAC Atrelado e Otimizado**: O motor `firestore.rules` foi programado de forma modular e granular. Sem sobreposições não intencionais (default read/write control).
- **Consultas Limitadas**: Uso rigorosamente ordenado de `limit()` e relatórios consolidados em Background para não exaurir a rede cliente-servidor (especificamente painéis de Turma/Professor). O Firebase limitando chamadas em massa com uso de `useMemo()`.
