import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../components/common/Button';

interface Activity {
  id: string;
  previousActivityId?: string;
  nextActivityId?: string;
  // Autres propriétés nécessaires
}

interface ActivityNavigationProps {
  activity: Activity;
  navigateToActivity: (activityId: string) => void;
}

const ActivityNavigation: React.FC<ActivityNavigationProps> = ({ 
  activity, 
  navigateToActivity 
}) => {
  return (
    <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
      <Button 
        variant="gold" 
        onClick={() => {
          if (activity.previousActivityId) {
            navigateToActivity(activity.previousActivityId);
          }
        }}
        disabled={!activity.previousActivityId}
      >
        <ChevronLeft size={16} className="mr-1" />
        Précédente
      </Button>
      
      <Button 
        variant="gold" 
        onClick={() => {
          if (activity.nextActivityId) {
            navigateToActivity(activity.nextActivityId);
          }
        }}
        disabled={!activity.nextActivityId}
      >
        Suivante
        <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
};

export default ActivityNavigation;
