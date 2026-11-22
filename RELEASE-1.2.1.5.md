# 1.2.1.5 — edição personalizada mantida por Roger Gama

Baseada na versão oficial 1.2.1 do Redmine Issue Templates. Esta edição preserva
os créditos e a licença originais e não é uma versão oficial da Agileware.

## Melhorias

- Substituição automática de assunto e descrição, sem concatenação e sem confirmação.
- Remoção da opção de substituição e do link Reverter.
- Limpeza ao trocar para um Tipo sem modelo padrão, mesmo com vários modelos disponíveis.
- Carregamento automático quando houver modelo padrão.
- Restauração dos ícones Corpo da tarefa e Aplicar no Redmine 6 (correção upstream #116).
- Identificação da edição personalizada e endereço do seu repositório no menu Plugins.

## Atualização

Use o ZIP completo, extraia a pasta redmine_issue_templates e substitua o plugin existente.
Renove os assets conforme o README e reinicie o Redmine. A atualização sobre a 1.2.1
não requer novas migrations. A primeira instalação continua exigindo as migrations originais.

## Validação

29 testes JavaScript aprovados. JavaScript compilado incluído. Validação integrada
com Redmine/Ruby/Rails pendente; teste na sua instância de homologação.

## Créditos

Projeto original: https://github.com/agileware-jp/redmine_issue_templates
Manutenção desta edição: Roger Gama — https://github.com/rogerlgama
Detalhes: CREDITS.md e CHANGELOG.md.
