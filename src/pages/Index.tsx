
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Users, 
  Settings, 
  CheckCircle, 
  Circle, 
  Calendar,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
  Award
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const Index = () => {
  const [currentRole, setCurrentRole] = useState<'employee' | 'manager' | 'admin'>('employee');

  // Sample data for different dashboards
  const habitData = [
    { name: 'Mon', exercise: 100, reading: 80, meditation: 60 },
    { name: 'Tue', exercise: 80, reading: 100, meditation: 80 },
    { name: 'Wed', exercise: 60, reading: 60, meditation: 100 },
    { name: 'Thu', exercise: 100, reading: 100, meditation: 40 },
    { name: 'Fri', exercise: 80, reading: 80, meditation: 80 },
    { name: 'Sat', exercise: 100, reading: 60, meditation: 100 },
    { name: 'Sun', exercise: 60, reading: 100, meditation: 60 },
  ];

  const teamData = [
    { name: 'Alice', habits: 85, tasks: 92 },
    { name: 'Bob', habits: 78, tasks: 88 },
    { name: 'Carol', habits: 92, tasks: 85 },
    { name: 'David', habits: 73, tasks: 90 },
    { name: 'Eve', habits: 88, tasks: 87 },
  ];

  const pieData = [
    { name: 'Completed', value: 65, color: '#10b981' },
    { name: 'In Progress', value: 25, color: '#3b82f6' },
    { name: 'Pending', value: 10, color: '#f59e0b' },
  ];

  const EmployeeDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Habits</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">3/5</div>
            <p className="text-xs text-blue-600">Completed today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Done</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">8/12</div>
            <p className="text-xs text-green-600">67% completion rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Streak</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">14</div>
            <p className="text-xs text-purple-600">Days in a row</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Habits</CardTitle>
            <CardDescription>Track your daily habit completion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Morning Exercise', completed: true, streak: 14 },
              { name: 'Read 30 minutes', completed: true, streak: 12 },
              { name: 'Meditation', completed: true, streak: 8 },
              { name: 'Drink 8 glasses water', completed: false, streak: 3 },
              { name: 'No social media', completed: false, streak: 0 },
            ].map((habit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {habit.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={habit.completed ? 'text-green-700' : 'text-gray-600'}>
                    {habit.name}
                  </span>
                </div>
                <Badge variant={habit.streak > 0 ? 'default' : 'secondary'}>
                  {habit.streak} day streak
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Your habit completion over the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="exercise" stroke="#3b82f6" strokeWidth={3} />
                <Line type="monotone" dataKey="reading" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="meditation" stroke="#8b5cf6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
          <CardDescription>Your work items for today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { task: 'Complete project proposal', priority: 'High', completed: true, time: '2h' },
            { task: 'Review team feedback', priority: 'Medium', completed: true, time: '1h' },
            { task: 'Client meeting preparation', priority: 'High', completed: false, time: '1.5h' },
            { task: 'Update documentation', priority: 'Low', completed: false, time: '30m' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                    {item.task}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}>
                      {item.priority}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const ManagerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Habit Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">83%</div>
            <p className="text-xs text-muted-foreground">+2% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Carol</div>
            <p className="text-xs text-muted-foreground">92% overall score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Individual habit and task completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="habits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Current task status across team</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Individual progress overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamData.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">Team Member</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Habits:</span>
                    <Progress value={member.habits} className="w-20" />
                    <span className="text-sm font-medium">{member.habits}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Tasks:</span>
                    <Progress value={member.tasks} className="w-20" />
                    <span className="text-sm font-medium">{member.tasks}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Across departments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,842</div>
            <p className="text-xs text-muted-foreground">65% engagement rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user registration trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', users: 400 },
                { month: 'Feb', users: 520 },
                { month: 'Mar', users: 680 },
                { month: 'Apr', users: 750 },
                { month: 'May', users: 890 },
                { month: 'Jun', users: 1020 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>System management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics Dashboard
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { action: 'New user registration', user: 'john.doe@company.com', time: '2 minutes ago' },
              { action: 'Team created', user: 'Alice Manager', time: '15 minutes ago' },
              { action: 'System backup completed', user: 'System', time: '1 hour ago' },
              { action: 'Weekly report generated', user: 'System', time: '2 hours ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.user}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <Progress value={45} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">67%</span>
              </div>
              <Progress value={67} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Database Load</span>
                <span className="text-sm font-medium">32%</span>
              </div>
              <Progress value={32} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm font-medium">120ms</span>
              </div>
              <Progress value={80} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Productivity Tracker
              </h1>
              <p className="text-gray-600">
                Build better habits and boost your productivity
              </p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button
                variant={currentRole === 'employee' ? 'default' : 'outline'}
                onClick={() => setCurrentRole('employee')}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Employee</span>
              </Button>
              <Button
                variant={currentRole === 'manager' ? 'default' : 'outline'}
                onClick={() => setCurrentRole('manager')}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Manager</span>
              </Button>
              <Button
                variant={currentRole === 'admin' ? 'default' : 'outline'}
                onClick={() => setCurrentRole('admin')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            </div>
          </div>
        </div>

        {currentRole === 'employee' && <EmployeeDashboard />}
        {currentRole === 'manager' && <ManagerDashboard />}
        {currentRole === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
};

export default Index;
