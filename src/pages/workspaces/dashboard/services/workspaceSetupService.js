import { supabase } from '../../../../lib/supabaseClient';
import {
  DEFAULT_GROUPS,
  DEFAULT_TICKET_TYPES,
  DEFAULT_TICKET_TOPICS,
  DEFAULT_TAGS,
  DEFAULT_RESOLUTIONS,
  SAMPLE_TICKET,
  SAMPLE_MACRO
} from '../constants/defaultWorkspaceConfig';

/**
 * Service for setting up a new workspace with all default configurations
 */
export const workspaceSetupService = {
  /**
   * Creates a new workspace with all default configurations
   */
  async createWorkspace(name, userId) {
    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{
        name,
        owner_id: userId,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Create workspace membership for owner
    await this.createOwnerMembership(workspace.id, userId);

    // Create ticket configuration
    await this.createTicketConfig(workspace.id);

    // Create default groups and add owner to Management group
    const managementGroupId = await this.createDefaultGroups(workspace.id, userId);

    // Create default ticket options
    const [techSupportTopicId, taskTypeId] = await Promise.all([
      this.createDefaultTopics(workspace.id),
      this.createDefaultTypes(workspace.id),
      this.createDefaultTags(workspace.id),
      this.createDefaultResolutions(workspace.id)
    ]);

    // Create sample data
    await this.createSampleData(workspace.id, userId, managementGroupId, techSupportTopicId, taskTypeId);

    return workspace;
  },

  /**
   * Creates the owner membership for the workspace
   */
  async createOwnerMembership(workspaceId, userId) {
    const { error } = await supabase
      .from('workspace_memberships')
      .insert([{
        workspace_id: workspaceId,
        user_id: userId,
        created_at: new Date().toISOString(),
        role: 'owner'
      }]);

    if (error) throw error;
  },

  /**
   * Creates the default ticket configuration
   */
  async createTicketConfig(workspaceId) {
    const { error } = await supabase
      .from('ticket_configs')
      .insert([{
        workspace_id: workspaceId,
        has_groups: true,
        has_type: true,
        has_topic: true,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  },

  /**
   * Creates default groups and adds owner to Management group
   * Returns the Management group ID
   */
  async createDefaultGroups(workspaceId, userId) {
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .insert(DEFAULT_GROUPS.map(name => ({
        name,
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      })))
      .select();

    if (groupsError) throw groupsError;

    const managementGroup = groups.find(g => g.name === 'Management');

    const { error: membershipError } = await supabase
      .from('group_memberships')
      .insert([{
        group_id: managementGroup.id,
        user_id: userId,
        created_at: new Date().toISOString()
      }]);

    if (membershipError) throw membershipError;

    return managementGroup.id;
  },

  /**
   * Creates default ticket types
   */
  async createDefaultTypes(workspaceId) {
    const { data, error } = await supabase
      .from('ticket_type_options')
      .insert(DEFAULT_TICKET_TYPES.map(name => ({
        name,
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      })))
      .select();

    if (error) throw error;

    return data.find(t => t.name === 'Task').id;
  },

  /**
   * Creates default ticket topics
   */
  async createDefaultTopics(workspaceId) {
    const { data, error } = await supabase
      .from('ticket_topic_options')
      .insert(DEFAULT_TICKET_TOPICS.map(name => ({
        name,
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      })))
      .select();

    if (error) throw error;

    return data.find(t => t.name === 'Technical Support').id;
  },

  /**
   * Creates default tags
   */
  async createDefaultTags(workspaceId) {
    const { data, error } = await supabase
      .from('ticket_tags')
      .insert(DEFAULT_TAGS.map(name => ({
        name,
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      })))
      .select();

    if (error) throw error;

    return data.find(t => t.name === 'FY2025').id;
  },

  /**
   * Creates default resolution options
   */
  async createDefaultResolutions(workspaceId) {
    const { error } = await supabase
      .from('ticket_resolution_options')
      .insert(DEFAULT_RESOLUTIONS.map(name => ({
        name,
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      })));

    if (error) throw error;
  },

  /**
   * Creates sample ticket and macro data
   */
  async createSampleData(workspaceId, userId, groupId, topicId, typeId) {
    // Create sample ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([{
        ...SAMPLE_TICKET,
        group_id: groupId,
        topic_id: topicId,
        type_id: typeId,
        workspace_id: workspaceId,
        creator_id: userId,
        requestor_id: userId,
        assignee_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Create ticket version
    const { error: versionError } = await supabase
      .from('ticket_versions')
      .insert([{
        ticket_id: ticket.id,
        ...SAMPLE_TICKET,
        group_id: groupId,
        topic_id: topicId,
        type_id: typeId,
        workspace_id: workspaceId,
        creator_id: userId,
        requestor_id: userId,
        assignee_id: userId,
        created_at: new Date().toISOString()
      }]);

    if (versionError) throw versionError;

    // Create sample macro
    const { error: macroError } = await supabase
      .from('tickets_macro')
      .insert([{
        ...SAMPLE_MACRO,
        group_id: groupId,
        topic_id: topicId,
        type_id: typeId,
        workspace_id: workspaceId,
        created_at: new Date().toISOString()
      }]);

    if (macroError) throw macroError;
  }
}; 