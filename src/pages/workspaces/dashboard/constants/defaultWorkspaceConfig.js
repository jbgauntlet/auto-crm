/**
 * Default configuration values for new workspaces
 */

export const DEFAULT_GROUPS = [
  'Sales',
  'Billing',
  'Finance',
  'Engineering',
  'Support',
  'Product Management',
  'Management'
];

export const DEFAULT_TICKET_TYPES = [
  'Task',
  'Bug',
  'Question',
  'Issue'
];

export const DEFAULT_TICKET_TOPICS = [
  'Technical Support',
  'Product Issue',
  'Billing Issue',
  'Customer Inquiry',
  'Returns',
  'Refund',
  'Account Information'
];

export const DEFAULT_TAGS = [
  'FY2025',
  'Project_Name'
];

export const DEFAULT_RESOLUTIONS = [
  'Fixed',
  'Can\'t Reproduce',
  'Not to be fixed',
  'Duplicate'
];

export const SAMPLE_TICKET = {
  subject: 'Sample issue',
  description: 'This is a sample ticket.',
  priority: 'urgent',
  status: 'open'
};

export const SAMPLE_MACRO = {
  subject: 'Sample macro',
  description: 'This is a sample macro that can be used as a template.',
  priority: 'high'
}; 