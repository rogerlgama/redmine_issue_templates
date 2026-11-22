# Redmine Issue Templates — versão personalizada

**Versão: 1.2.1.5** · **Manutenção desta edição: [Roger Gama](https://github.com/rogerlgama)**

Edição personalizada do [Redmine Issue Templates](https://github.com/agileware-jp/redmine_issue_templates),
baseada na tag oficial **1.2.1**, commit `94a56c1100014db5d5016dfc50ff7bdf5ae0fb47`.
Mantém a autoria, os avisos e a licença originais. **Não é uma versão oficial da Agileware.**

| Referência | Responsável / endereço |
|---|---|
| Autoria original | Akiko Takano e colaboradores; Agileware Inc. no registro do plugin |
| Projeto original | https://github.com/agileware-jp/redmine_issue_templates |
| Manutenção e melhorias desta edição | Roger Gama |
| Código desta edição | https://github.com/rogerlgama/redmine_issue_templates |
| Versão personalizada | 1.2.1.5 |
| Licença | GNU GPL v2 ou posterior, conforme os avisos originais |

## Melhorias de usabilidade

- Aplicação de um modelo substitui integralmente assunto e descrição, sem concatenação.
- Trocar o Tipo durante a criação carrega o modelo padrão, quando houver.
- Sem modelo padrão selecionado, assunto e descrição ficam vazios, mesmo que existam várias opções.
- Sem modelos disponíveis, os campos também são limpos.
- Removidas a opção “Substituir assunto e descrição” (global e por projeto), a confirmação e o link “Reverter”.
- Restaurada a visibilidade dos ícones “Corpo da tarefa” e “Aplicar” no Redmine 6, seguindo a correção upstream #116.
- Mantidos o seletor de modelos, a pré-visualização e o link “Limpar assunto e descrição”.

A aplicação de outro modelo substitui também o texto editado manualmente. A alteração de Tipo para
um tipo sem modelo padrão limpa o texto anterior, conforme o comportamento desta edição.

## Instalação e atualização

O diretório do plugin deve continuar com o nome **`redmine_issue_templates`**.
Esta edição substitui o plugin existente e não deve ser instalada em paralelo com ele.

### Atualização a partir da versão 1.2.1 ou das edições 1.2.1.1–1.2.1.4

1. Faça backup da pasta atual e do banco de dados.
2. Pare o Redmine e substitua `plugins/redmine_issue_templates` pela pasta contida no ZIP.
3. Remova a cópia antiga em `public/plugin_assets/redmine_issue_templates`, se existir.
4. Reinicie o Redmine e recarregue o navegador com **Ctrl+F5**.
5. Em Administração → Plugins, confira a identificação da versão personalizada **1.2.1.5**.

**A atualização não adiciona migrations** em relação à 1.2.1. Não é necessário executar migrations
para instalar estas melhorias sobre uma instalação existente que já tenha migrado o plugin original.
O JavaScript compilado está incluído: Node.js não é necessário no servidor de produção.

### Primeira instalação do Issue Templates

O plugin original contém tabelas próprias. Em uma instalação nova, execute suas migrations:

```bash
bundle exec rake redmine:plugins:migrate NAME=redmine_issue_templates RAILS_ENV=production
```

Reinicie o Redmine, habilite o módulo Modelos de tarefas nos projetos e configure as permissões.
Veja também as [instruções detalhadas](LEIA-ME-ATUALIZACAO.md) e o [README original](README.upstream.md).

## Validação

Foram aprovados **29 testes JavaScript**, executados com adaptadores DOM/HTTP simulados:

```bash
node --test test/javascript/automatic_templates.test.cjs
```

A edição foi preparada para uso no Redmine 6.0.6. Os testes RSpec e a validação integrada com
Ruby/Rails não foram executados no ambiente de preparação. Confira [VALIDACAO.txt](VALIDACAO.txt)
e valide no seu Redmine de testes antes de atualizar a produção.

## Histórico, distribuição e contribuição

- [Histórico das alterações](CHANGELOG.md)
- [Créditos e procedência](CREDITS.md)
- [Releases desta edição](https://github.com/rogerlgama/redmine_issue_templates/releases)
- [Issues desta edição](https://github.com/rogerlgama/redmine_issue_templates/issues)

As melhorias desta edição são mantidas por Roger Gama. Correções já existentes no projeto original
são identificadas como tais no histórico. Propostas para o upstream devem considerar as alterações
que já foram incorporadas por seus mantenedores.

## Licença

Preservada a licença do projeto original e seus avisos de copyright. Consulte [LICENSE.txt](LICENSE.txt)
e os cabeçalhos dos arquivos. As alterações desta edição são distribuídas sob os mesmos termos.
