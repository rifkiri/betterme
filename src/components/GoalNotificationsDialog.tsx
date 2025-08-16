import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Target, UserCog, UserCheck, User, X } from 'lucide-react';
import { GoalNotification, Goal } from '@/types/productivity';

interface GoalNotificationsDialogProps {
  notifications: GoalNotification[];
  goals: Goal[];
  onAcknowledge: (notificationId: string) => void;
  onAcknowledgeAll: () => void;
}

export const GoalNotificationsDialog = ({
  notifications,
  goals,
  onAcknowledge,
  onAcknowledgeAll
}: GoalNotificationsDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (notifications.length > 0) {
      setOpen(true);
    }
  }, [notifications.length]);

  const getGoalByNotification = (notification: GoalNotification): Goal | undefined => {
    return goals.find(goal => goal.id === notification.goalId);
  };

  const getRoleIcon = (role: 'coach' | 'lead' | 'member') => {
    switch (role) {
      case 'coach':
        return <UserCog className="h-4 w-4 text-blue-600" />;
      case 'lead':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'member':
        return <User className="h-4 w-4 text-purple-600" />;
    }
  };

  const getRoleBadgeColor = (role: 'coach' | 'lead' | 'member') => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800';
      case 'lead':
        return 'bg-green-100 text-green-800';
      case 'member':
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getNotificationMessage = (notification: GoalNotification, goal?: Goal) => {
    if (!goal) return 'Goal not found';

    if (notification.notificationType === 'assignment') {
      return `You have been assigned as ${notification.role} for the goal "${goal.title}"`;
    } else {
      return `A user has self-assigned as member to the goal "${goal.title}"`;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Goal Notifications
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            You have new notifications about goal assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {notifications.map((notification) => {
            const goal = getGoalByNotification(notification);
            
            return (
              <Card key={notification.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          Goal Assignment
                        </span>
                        <Badge variant="outline" className={getRoleBadgeColor(notification.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(notification.role)}
                            {notification.role}
                          </span>
                        </Badge>
                        {notification.notificationType === 'self_assignment' && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Self-Assignment
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        {getNotificationMessage(notification, goal)}
                      </p>
                      
                      {goal && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Target: {goal.targetValue} {goal.unit}</span>
                            <span>Progress: {goal.progress}%</span>
                            {goal.deadline && (
                              <span>Deadline: {goal.deadline.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>Received: {notification.createdDate.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-4"
                      onClick={() => onAcknowledge(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={onAcknowledgeAll} className="bg-blue-600 hover:bg-blue-700">
            Acknowledge All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};