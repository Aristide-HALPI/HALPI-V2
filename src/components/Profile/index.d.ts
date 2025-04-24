import React from 'react';

// Déclaration de type pour ProgressTable
export interface ProgressTableProps {
  userId: string;
}
declare const ProgressTable: React.FC<ProgressTableProps>;
export default ProgressTable;

// Déclaration de type pour SettingsForm
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  institution_type?: string;
  institution?: string;
  study_field?: string;
  academic_year?: string;
  platform_usage?: string;
  availability?: Record<string, string[]>;
  daily_time_goal?: number;
  weekly_time_goal?: number;
}

export interface SettingsFormProps {
  profile: UserProfile | null;
}
declare const SettingsForm: React.FC<SettingsFormProps>;
export { SettingsForm };

// Déclaration de type pour ExamFeedbackForm
export interface ExamFeedbackFormProps {
  userId: string;
}
declare const ExamFeedbackForm: React.FC<ExamFeedbackFormProps>;
export { ExamFeedbackForm };
