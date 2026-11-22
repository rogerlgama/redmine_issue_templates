const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'scripts/issue_templates.js'), 'utf8')
  .replace(/^import .*;\s*$/gm, '');

function setup({ isNew = true, trigger = 'issue_tracker_id', templates = 0,
  cookie = '', legacyOption = 'false', selectedValue = templates > 0 ? '42' : '' } = {}) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', innerHTML: '', style: {},
      classList: { add() {}, remove() {}, contains() { return false; } },
      setAttribute() {}, getAttribute() {}, dispatchEvent() {}
    });
    return elements.get(id);
  };
  element('issue_subject').value = 'Old title';
  element('issue_description').value = 'Old description';
  element('issue_template').value = selectedValue;
  const window = { confirm() { throw new Error('Confirmation must not be requested'); } };
  const document = {
    cookie, getElementById: id => elements.get(id) ?? element(id),
    querySelector: () => null,
    querySelectorAll: selector => Array.from({ length:
      selector === '#issue-form.new_issue' ? Number(isNew) : templates
    })
  };
  let response = '';
  const context = vm.createContext({ window, document, Event: class {}, console,
    axios: { defaults: { headers: {} }, post: () => Promise.resolve({ data: response }) }
  });
  vm.runInContext(source, context);
  const instance = new window.ISSUE_TEMPLATE({
    shouldReplaced: legacyOption, isTriggeredBy: trigger, pulldownUrl: '/templates'
  });
  return { instance, element, elements, context, setResponse: value => { response = value; } };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('multiple templates without a default clear the previous title and description on tracker change', async () => {
  const s = setup({ templates: 2, selectedValue: '' });
  s.instance.setPulldown('2');
  await settle();
  assert.equal(s.element('issue_subject').value, '');
  assert.equal(s.element('issue_description').value, '');
  assert.equal(s.element('template_area').style.display, 'inline');
});

test('one non-default template also leaves the form blank until a model is selected', async () => {
  const s = setup({ templates: 1, selectedValue: '' });
  s.instance.setPulldown('2');
  await settle();
  assert.equal(s.element('issue_description').value, '');
  assert.equal(s.element('issue_subject').value, '');
});

for (const isGlobal of [false, true]) {
  test(`a default among multiple templates is loaded automatically (${isGlobal ? 'global' : 'local/inherited'})`, async () => {
    const s = setup({ templates: 2, selectedValue: '42' });
    const selected = s.element('issue_template');
    selected.selectedIndex = 0;
    selected.options = [{ classList: { contains: value => value === 'global' && isGlobal } }];
    s.instance.loadUrl = '/load';
    selected.dispatchEvent = () => s.instance.loadTemplate();
    const requests = [];
    s.context.axios.post = async (url, data) => {
      requests.push({ url, data });
      return { data: url === '/load'
        ? { issue_template: { issue_title: 'Default title', description: 'Default description' } }
        : '<option selected>Default</option>' };
    };
    s.instance.setPulldown('2');
    await settle();
    assert.equal(s.element('issue_subject').value, 'Default title');
    assert.equal(s.element('issue_description').value, 'Default description');
    assert.equal(requests.length, 2);
    assert.equal(requests[1].data.template_type, isGlobal ? 'global' : '');
  });
}

test('CKEditor also clears when several templates exist but none is the default', async () => {
  const s = setup({ templates: 2, selectedValue: '' });
  let editorText = 'Old model';
  s.context.CKEDITOR = { instances: { issue_description: { setData: value => { editorText = value; } } } };
  s.instance.setPulldown('2');
  await settle();
  assert.equal(editorText, '');
  assert.equal(s.element('issue_description').value, '');
});

for (const config of [{ isNew: false }, { trigger: '' }]) {
  test(`multiple non-default templates do not clear outside a new-issue tracker change (${JSON.stringify(config)})`, async () => {
    const s = setup({ templates: 2, selectedValue: '', ...config });
    s.instance.setPulldown('2');
    await settle();
    assert.equal(s.element('issue_description').value, 'Old description');
    assert.equal(s.element('issue_subject').value, 'Old title');
  });
}

for (const legacyOption of ['false', 'true']) {
  test(`old project option ${legacyOption} cannot prevent automatic replacement`, () => {
    const s = setup({ legacyOption });
    s.instance.replaceTemplateValue({ description: 'New description', issue_title: 'New title' });
    assert.equal(s.element('issue_subject').value, 'New title');
    assert.equal(s.element('issue_description').value, 'New description');
  });
}

test('successive templates replace rather than concatenate', () => {
  const s = setup();
  for (const value of ['A', 'B', 'C']) {
    s.instance.replaceTemplateValue({ description: value, issue_title: value });
    assert.equal(s.element('issue_description').value, value);
    assert.equal(s.element('issue_subject').value, value);
  }
});

test('empty template fields remove previous content', () => {
  const s = setup();
  s.instance.replaceTemplateValue({ description: '', issue_title: '' });
  assert.equal(s.element('issue_description').value, '');
  assert.equal(s.element('issue_subject').value, '');
});

test('null template fields remove previous content', () => {
  const s = setup();
  s.instance.replaceTemplateValue({ description: null, issue_title: null });
  assert.equal(s.element('issue_description').value, '');
  assert.equal(s.element('issue_subject').value, '');
});

for (const cookie of ['', 'issue_template_confirm_to_replace_hide_dialog=0',
  'issue_template_confirm_to_replace_hide_dialog=1']) {
  test(`no-template clearing needs no confirmation with cookie: ${cookie || 'absent'}`, async () => {
    const s = setup({ cookie });
    s.instance.setPulldown('2');
    await settle();
    assert.equal(s.element('issue_description').value, '');
    assert.equal(s.element('issue_subject').value, '');
  });
}

test('loading a model through HTTP immediately replaces existing text without a dialog', async () => {
  const s = setup();
  const selected = s.element('issue_template');
  selected.value = '42';
  selected.selectedIndex = 0;
  selected.options = [{ classList: { contains() { return false; } } }];
  s.setResponse({ issue_template: { description: 'HTTP model', issue_title: 'HTTP title' } });
  s.instance.loadTemplate();
  await settle();
  assert.equal(s.element('issue_description').value, 'HTTP model');
  assert.equal(s.element('issue_subject').value, 'HTTP title');
});

test('CKEditor content is replaced and cleared along with the textarea', async () => {
  const s = setup();
  let editorText = 'Unsynchronized text';
  s.context.CKEDITOR = { instances: { issue_description: {
    setData: value => { editorText = value; }
  } } };
  s.instance.replaceTemplateValue({ description: 'New model', issue_title: 'New title' });
  assert.equal(editorText, 'New model');
  s.instance.setPulldown('2');
  await settle();
  assert.equal(editorText, '');
  assert.equal(s.element('issue_description').value, '');
});

test('title is replaced when the tracker has no description field', () => {
  const s = setup();
  s.elements.set('issue_description', null);
  s.context.document.getElementById = id => s.elements.has(id) ? s.elements.get(id) : s.element(id);
  s.instance.replaceTemplateValue({ description: 'Unused', issue_title: 'Title only' });
  assert.equal(s.element('issue_subject').value, 'Title only');
});

for (const [name, config] of [
  ['editing an existing issue', { isNew: false }],
  ['initial form display', { trigger: '' }],
  ['project change', { trigger: 'issue_project_id' }],
  ['new tracker has a template', { templates: 1 }]
]) {
  test(`no-template clearing does not run when ${name}`, async () => {
    const s = setup(config);
    s.instance.setPulldown('2');
    await settle();
    assert.equal(s.element('issue_subject').value, 'Old title');
    assert.equal(s.element('issue_description').value, 'Old description');
  });
}

test('replacement settings and confirmation controls are absent from the UI', () => {
  for (const name of ['app/views/settings/_redmine_issue_templates.html.erb',
    'app/views/issue_templates_settings/index.html.erb',
    'app/views/issue_templates/_issue_select_form.html.erb']) {
    const text = fs.readFileSync(path.join(root, name), 'utf8');
    assert.doesNotMatch(text, /should_replaced|shouldReplaced|replace_content|confirm_to_replace|overwrite_yes|confirmClear/);
  }
});


test('revert controls and their browser handler are removed', () => {
  const form = fs.readFileSync(path.join(root, 'app/views/issue_templates/_issue_select_form.html.erb'), 'utf8');
  assert.doesNotMatch(form, /revert_template|revertAppliedTemplate|original_subject|original_description|You can revert/);
  assert.doesNotMatch(source, /revertAppliedTemplate|revert_template|original_subject|original_description/);
  assert.match(form, /id='erase_template'/);
});

test('local, inherited and global popup icons use the Redmine 6 icon-only class', () => {
  const view = fs.readFileSync(path.join(root, 'app/views/issue_templates/_list_templates.html.erb'), 'utf8');
  assert.equal((view.match(/class='icon-only template_tooltip'/g) || []).length, 3);
  assert.equal((view.match(/class='icon-only icon-test template-update-link/g) || []).length, 3);
  assert.doesNotMatch(view, /class='icon (?:template_tooltip|icon-test template-update-link)/);
});

test('note popup preview and apply icons use the same compatible class', () => {
  const view = fs.readFileSync(path.join(root, 'app/views/note_templates/_list_note_templates.html.erb'), 'utf8');
  assert.equal((view.match(/class='icon-only template_tooltip'/g) || []).length, 2);
  assert.equal((view.match(/class='icon-only icon-test /g) || []).length, 2);
});

for (const kind of ['local', 'inherited', 'global']) {
  test(`clear, open popup and apply a ${kind} template restores its text without confirmation`, async () => {
    const s = setup();
    let click;
    const link = {
      classList: { contains: value => value === 'template-global' && kind === 'global' },
      getAttribute: name => name === 'data-issue-template-id' ? '42' : null,
      addEventListener: (name, handler) => { if (name === 'click') click = handler; }
    };
    const selected = s.element('issue_template');
    selected.selectedIndex = 0;
    selected.options = [{ classList: { contains: value => value === 'global' && kind === 'global' } }];
    const option = {};
    Object.defineProperty(option, 'selected', { set: () => { selected.value = '42'; } });
    selected.dispatchEvent = () => s.instance.loadTemplate();
    s.context.document.querySelectorAll = selector => selector === 'i.template-update-link' ? [link] : [];
    s.context.document.querySelector = selector => selector.startsWith('#issue_template >') ? option : null;
    s.context.axios.get = async () => ({ data: '<table>Template list</table>' });
    const payload = { issue_title: 'Restored title', description: 'Restored body' };
    s.setResponse(kind === 'global' ? { global_template: payload } : { issue_template: payload });
    s.instance.eraseSubjectAndDescription();
    assert.equal(s.element('issue_subject').value, '');
    assert.equal(s.element('issue_description').value, '');
    s.instance.openDialog('/list', 'Templates');
    await settle();
    assert.equal(typeof click, 'function');
    assert.equal(s.element('filtered_templates_list').innerHTML, '<table>Template list</table>');
    click({ target: link });
    await settle();
    assert.equal(selected.value, '42');
    assert.equal(s.element('issue_subject').value, 'Restored title');
    assert.equal(s.element('issue_description').value, 'Restored body');
  });
}
