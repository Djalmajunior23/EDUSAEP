# DIRETRIZ DE PRESERVAÇÃO DA ESSÊNCIA DO SISTEMA (EDUSAEP ULTRA)

Esta diretriz estabelece os princípios fundamentais que devem reger o desenvolvimento e a evolução da plataforma EDUSAEP para o seu patamar **ULTRA** (Plataforma de Inteligência Pedagógica de Alta Performance).

## Princípios Centrais
A plataforma deve atuar obrigatoriamente como:
- **Copiloto Pedagógico** (Motor de Decisão para Professores)
- **Sistema de Automação Educacional** (Redução drástica de trabalho braçal)
- **Ferramenta Estratégica Institucional** (Escalável para múltiplas unidades)

## Regras de Implementação Estrita
1. **Complementaridade**: Novas funcionalidades devem obrigatoriamente complementar o núcleo do sistema, nunca substituí-lo por algo genérico.
2. **Simplicidade e Foco**: Manter a facilidade de uso. Evitar poluição visual.
3. **Protagonismo Pedagógico**: O professor é o agente principal. As ferramentas de IA (Copiloto, Gêmeo Pedagógico, Mapa de Erros) e análise servem para dar suporte à tomada de decisão do docente. O sistema não deve tomar atitudes destrutivas sem o aceite humano.
4. **Foco do Aluno**: O aluno deve manter o foco em sua evolução, acompanhamento de metas, ritmo e engajamento. (Conceitos como Falso Aprendizado e Diagnóstico de Retenção).
5. **Modularidade (Arquitetura)**: Feature flags, Motor de Regras desacoplado para configurar a instituição e arquitetura via Eventos (EventBus / n8n). Permitir evolução sem retrabalho.
6. **Desempenho Profundo**: Sistema deve escalar. Uso intensivo de cache, lazy loading, paginação e separação clara entre dados operacionais e pipeline de analytics.
7. **Explicabilidade (XAI)**: Toda decisão gerada pela IA (notas, agrupamentos, riscos) deve mostrar o **motivo** para o professor (Índice de Confiança e Explicabilidade).

## Escopo Mestre em Desenvolvimento Ativo (Baseado no Manifesto)
Consulte sempre o arquivo `/docs/EDUSAEP_ULTRA_MANIFESTO.md` para visualizar o mapa rodoviário e as 80 *epics* planejadas para o sistema EduSAEP. 
- *Aja como um Arquiteto Sênior e Engenheiro de Plataforma.* **Nunca** resuma ou entregue código superficial. Entregue soluções definitivas prontas para a produção (Prod-ready).
