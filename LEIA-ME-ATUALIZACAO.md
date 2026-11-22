# Issue Templates 1.2.1.5 — aplicação automática dos modelos

Versão personalizada baseada na tag oficial 1.2.1 e sucessora da adaptação
1.2.1.4. Não é uma versão oficial da Agileware. Autoria e licença GPL v2
originais preservadas. Repositório original:
https://github.com/agileware-jp/redmine_issue_templates

## Correção da versão 1.2.1.5

Na tela Nova tarefa, após alterar o Tipo:

- Sem modelos: assunto e descrição ficam vazios.
- Com um ou mais modelos, mas sem padrão selecionado: assunto e descrição
  ficam vazios; o usuário pode escolher um modelo no seletor ou pela lista.
- Com um modelo padrão selecionado: o assunto e a descrição desse modelo
  são carregados automaticamente, mesmo que haja várias opções disponíveis.

A decisão de limpar considera o valor efetivamente selecionado após a resposta
que atualiza a lista de modelos. A presença de opções na lista não implica
que algum modelo esteja selecionado.

A correção mantém as restrições existentes de módulo/permissão e o escopo de
limpeza durante a mudança de Tipo em uma tarefa nova. Não introduz uma limpeza
adicional ao abrir o formulário inicialmente ou ao editar uma tarefa existente.

Todas as demais melhorias da versão 1.2.1.4 foram mantidas.

## Correção anterior — versão 1.2.1.4

Os ícones de “Corpo da tarefa” e “Aplicar” na lista de modelos voltam a ter
área visível e clicável no Redmine 6. A causa é a classe CSS antiga `icon`
usada em elementos vazios, incompatível com a apresentação desses ícones no
Redmine 6. Foi aplicada a classe `icon-only`, seguindo a correção do projeto
original (PR #116). A ação de limpar os campos não excluía os controles;
o problema estava na renderização dos ícones.

A adequação abrange modelos locais, herdados, globais e de comentários.
As demais melhorias da versão 1.2.1.3 permanecem mantidas.

Teste após atualizar: em Nova tarefa, limpe assunto e descrição; abra
“Visualizar conteúdo do template”; passe o mouse sobre o ícone de Corpo da
tarefa e clique no ícone Aplicar. O modelo deve ser reaplicado sem confirmação.

## Comportamento

- A opção “Substituir assunto e descrição” foi removida das configurações
  globais do plugin e das configurações por projeto.
- A confirmação “Você quer substituir o assunto e a descrição?” foi removida.
- A aplicação de um modelo substitui integralmente o título e a descrição,
  sem concatenar e sem pedir confirmação, inclusive quando o usuário seleciona
  manualmente outro modelo no seletor “Modelo de tarefa”.
- Na tela Nova tarefa, trocar o Tipo para um tipo sem modelo limpa automaticamente
  título e descrição, sem confirmação. A limpeza considera o mesmo escopo da
  correção anterior: alteração de Tipo durante a criação, com módulo e permissão
  de modelos habilitados e formulário integrado ao plugin.
- Valores vazios no modelo também substituem os campos anteriores por vazio.
- Alterações manuais no título e na descrição também são substituídas ao aplicar
  outro modelo ou limpas ao trocar para um tipo sem modelo, conforme a regra solicitada.
- Configurações antigas, globais ou por projeto, e cookies antigos de confirmação
  não interferem mais na substituição. Os valores antigos no banco são preservados
  para permitir reversão sem migrations.
- O link Reverter foi removido, junto com sua rotina de restauração.
- O link Limpar assunto e descrição continua disponível.
- A mensagem informativa de aplicação não faz mais referência à reversão.
- As regras existentes de disponibilidade dos modelos, permissões, campos
  adicionais e demais funcionalidades do plugin permanecem aplicáveis.

## Atualização das versões 1.2.1 a 1.2.1.4

1. Faça backup da pasta `plugins/redmine_issue_templates` e do banco.
   Guarde a cópia da pasta fora de `plugins`, para evitar carregamento duplicado.
2. Pare o Redmine e substitua a pasta pela pasta completa `redmine_issue_templates`
   contida neste ZIP. Mantenha exatamente esse nome.
3. Remova a cópia antiga dos assets em `public/plugin_assets/redmine_issue_templates`,
   se existir, para que o JavaScript atualizado seja publicado.
4. Reinicie o Redmine e recarregue o navegador com Ctrl+F5.
5. Confira a versão 1.2.1.5 em Administração → Plugins.
6. Reabra a tela Nova tarefa e teste a alteração do Tipo. Não há opção a habilitar.

Esta atualização não adiciona migrations, gems nem tabelas. O JavaScript compilado
está incluído; não é necessário instalar Node.js no servidor. Este pacote substitui
o Issue Templates existente; não deve ser instalado como um segundo plugin paralelo.

## Verificação no Redmine de testes

- Tipo A com modelo → Tipo B com modelo: somente conteúdo do modelo B, sem pergunta.
- Tipo com modelo → Tipo sem modelo: título e descrição vazios, sem pergunta.
- Tipo com modelo → Tipo com vários modelos sem padrão: título e descrição vazios.
- Tipo com modelo → Tipo com vários modelos e um padrão: conteúdo do padrão carregado.
- Trocas sucessivas de modelos: sem concatenação.
- Modelo com título/descrição vazios: o campo correspondente deve ficar vazio.
- Configurações globais e do projeto: opção de substituição ausente.
- Confira também pré-visualização, salvar a tarefa e edição conforme os demais
  plugins e configurações da instância.

## Testes do pacote

Consulte `VALIDACAO.txt`. Para repetir os testes JavaScript com Node.js:

```bash
node --test test/javascript/automatic_templates.test.cjs
```

Os testes RSpec de interface foram atualizados para a aplicação sem confirmação,
mas precisam de um ambiente Redmine com Ruby/Rails e navegador para execução.

## Reversão

Pare o Redmine, restaure a pasta do plugin anterior, remova os assets publicados
desse plugin e reinicie. Não execute migrations de desinstalação (`VERSION=0`),
pois isso removeria dados do plugin original. As antigas configurações armazenadas
continuam disponíveis para a versão anterior.
