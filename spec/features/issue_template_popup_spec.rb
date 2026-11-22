# frozen_string_literal: true

# Modified by Roger Gama on 2026-11-21: custom usability edition based on upstream 1.2.1. See CREDITS.md and CHANGELOG.md.

require_relative '../spec_helper'
require_relative '../rails_helper'
require_relative '../support/login_helper'

RSpec.configure do |c|
  c.include LoginHelper
end

feature 'Apply issue templates without confirmation', js: true do
  background(:all) do
    Redmine::Plugin.register(:redmine_issue_templates) do
      settings partial: 'settings/redmine_issue_templates',
               default: { 'apply_global_template_to_all_projects' => 'false' }
    end
  end

  given(:user) { FactoryBot.create(:user, :password_same_login, login: 'manager', language: 'en', admin: false) }
  given(:project) { create(:project_with_enabled_modules) }
  given(:tracker) { FactoryBot.create(:tracker, :with_default_status) }
  given(:role) { FactoryBot.create(:role, :manager_role) }
  given(:issue_priority) { FactoryBot.create(:priority) }
  given(:first_target) { page.find('#issue_template > optgroup > option:nth-child(1)') }
  given(:second_target) { page.find('#issue_template > optgroup > option:nth-child(2)') }
  given(:issue_subject) { page.find('#issue_subject') }
  given(:issue_description) { page.find('#issue_description') }
  given(:first_template) { IssueTemplate.first }
  given(:second_template) { IssueTemplate.second }

  given(:related_link) { page.find('#issue_template_related_link') }

  background do
    FactoryBot.create_list(:issue_template, 2, project_id: project.id, tracker_id: tracker.id,
                                               related_link: 'http://example.com/template/wiki#usage')

    project.trackers << tracker
    assign_template_priv(role, add_permission: :show_issue_templates)
    member = Member.new(project: project, user_id: user.id)
    member.member_roles << MemberRole.new(role: role)
    member.save
  end

  scenario 'Template pulldown is shown when new issue.' do
    visit_new_issue(user)
    expect(page).to have_selector('div#template_area select#issue_template')
    expect(issue_description.value).to eq ''
    expect(issue_subject.value).to eq ''
  end

  scenario 'Select template and content is updated' do
    visit_new_issue(user)
    first_target.select_option
    wait_for_ajax
    expect(issue_description.value).not_to eq ''
    expect(issue_description.value).to eq first_template.description
    expect(issue_subject.value).to eq first_template.issue_title

    expect(related_link.text).to eq 'Related Link'
    expect(related_link['href']).to eq 'http://example.com/template/wiki#usage'
  end

  scenario 'Preview and apply remain visible after clearing the fields' do
    visit_new_issue(user)
    first_target.select_option
    wait_for_ajax
    page.find('#erase_template').click
    expect(issue_subject.value).to eq ''
    expect(issue_description.value).to eq ''
    page.find('#link_template_dialog').click
    wait_for_ajax
    preview = page.first('#filtered_templates_list a.icon-only.template_tooltip')
    apply = page.first('#filtered_templates_list i.icon-only.template-update-link')
    expect(preview).to be_visible
    expect(apply).to be_visible
    preview.hover
    expect(page.first('#filtered_templates_list .template_tooltip_body')).to be_visible
    apply.click
    wait_for_ajax
    expect(issue_subject.value).to eq first_template.issue_title
    expect(issue_description.value).to eq first_template.description
  end

  context 'Has default template' do
    before do
      first_template.is_default = true
      first_template.save
    end

    [false, true].each do |legacy_replace_setting|
      context "Legacy project replacement value: #{legacy_replace_setting}" do
        before do
          IssueTemplateSetting.find_or_create(project.id).update!(should_replaced: legacy_replace_setting)
        end

        scenario 'Selecting another template replaces the title and description immediately' do
          visit_new_issue(user)
          wait_for_ajax
          expect(issue_description.value).to eq first_template.description
          second_target.select_option
          wait_for_ajax
          expect(page).not_to have_selector('#issue_template_confirm_to_replace_dialog', visible: :all)
          expect(issue_description.value).to eq second_template.description
          expect(issue_subject.value).to eq second_template.issue_title
        end
      end
    end

    context 'Tracker without core fields' do
      before { tracker.update!(core_fields: []) }

      scenario 'Apply the title without accessing a missing description field' do
        visit_new_issue(user)
        first_target.select_option
        wait_for_ajax
        expect(issue_subject.value).to eq first_template.issue_title
      end
    end
  end

  private

  def visit_new_issue(user)
    # TODO: If does not user update, authentication is failed. This is workaround.
    user.update_attribute(:admin, false)
    log_user(user.login, user.password)
    visit "/projects/#{project.identifier}/issues/new"
  end
end
