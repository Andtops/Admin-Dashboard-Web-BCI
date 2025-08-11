"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Target,
  Zap,
  BarChart3,
  Play,
  Pause,
  Trophy,
  AlertCircle
} from "lucide-react";

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    title: string;
    message: string;
    percentage: number;
    metrics: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      converted: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
    };
  }>;
  winner?: string;
  confidence: number;
  startDate: Date;
  endDate?: Date;
  targetAudience: string;
  testMetric: 'openRate' | 'clickRate' | 'conversionRate';
}

interface ABTestingDashboardProps {
  tests: ABTest[];
  onCreateTest: (test: Partial<ABTest>) => Promise<void>;
  onStartTest: (id: string) => Promise<void>;
  onStopTest: (id: string) => Promise<void>;
  onDeleteTest: (id: string) => Promise<void>;
}

export function ABTestingDashboard({
  tests,
  onCreateTest,
  onStartTest,
  onStopTest,
  onDeleteTest
}: ABTestingDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState<{
    name: string;
    targetAudience: string;
    testMetric: 'openRate' | 'clickRate' | 'conversionRate';
    variants: Array<{
      id: string;
      name: string;
      title: string;
      message: string;
      percentage: number;
    }>;
  }>({
    name: "",
    targetAudience: "all_users",
    testMetric: "openRate",
    variants: [
      { id: "A", name: "Variant A", title: "", message: "", percentage: 50 },
      { id: "B", name: "Variant B", title: "", message: "", percentage: 50 }
    ]
  });

  const handleCreateTest = async () => {
    try {
      await onCreateTest({
        name: newTest.name,
        targetAudience: newTest.targetAudience,
        testMetric: newTest.testMetric,
        variants: newTest.variants.map(variant => ({
          ...variant,
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            converted: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0
          }
        })),
        status: 'draft',
        confidence: 0,
        startDate: new Date()
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  const resetForm = () => {
    setNewTest({
      name: "",
      targetAudience: "all_users",
      testMetric: "openRate",
      variants: [
        { id: "A", name: "Variant A", title: "", message: "", percentage: 50 },
        { id: "B", name: "Variant B", title: "", message: "", percentage: 50 }
      ]
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-700">Running</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getWinnerBadge = (test: ABTest, variantId: string) => {
    if (test.winner === variantId) {
      return <Badge className="bg-green-100 text-green-700 ml-2"><Trophy className="h-3 w-3 mr-1" />Winner</Badge>;
    }
    return null;
  };

  const calculateStatisticalSignificance = (variantA: any, variantB: any) => {
    // Simplified statistical significance calculation
    // In production, use proper statistical tests
    const totalA = variantA.metrics.sent;
    const totalB = variantB.metrics.sent;
    const successA = variantA.metrics.opened;
    const successB = variantB.metrics.opened;

    if (totalA < 100 || totalB < 100) return 0; // Need minimum sample size

    const rateA = successA / totalA;
    const rateB = successB / totalB;
    const diff = Math.abs(rateA - rateB);

    // Simplified confidence calculation
    return Math.min(95, diff * 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">A/B Testing</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Test different notification variants to optimize engagement
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create A/B Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new A/B test to compare different notification variants
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    placeholder="e.g., Welcome Message Test"
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <select
                      id="targetAudience"
                      value={newTest.targetAudience}
                      onChange={(e) => setNewTest(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all_users">All Users</option>
                      <option value="new_users">New Users</option>
                      <option value="active_users">Active Users</option>
                      <option value="ios_users">iOS Users</option>
                      <option value="android_users">Android Users</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testMetric">Primary Metric</Label>
                    <select
                      id="testMetric"
                      value={newTest.testMetric}
                      onChange={(e) => setNewTest(prev => ({ ...prev, testMetric: e.target.value as 'openRate' | 'clickRate' | 'conversionRate' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="openRate">Open Rate</option>
                      <option value="clickRate">Click Rate</option>
                      <option value="conversionRate">Conversion Rate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Variants</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newTest.variants.map((variant, index) => (
                    <Card key={variant.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{variant.name}</h4>
                          <Badge variant="outline">{variant.percentage}%</Badge>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`title-${variant.id}`}>Title</Label>
                          <Input
                            id={`title-${variant.id}`}
                            placeholder="Notification title"
                            value={variant.title}
                            onChange={(e) => {
                              const updatedVariants = [...newTest.variants];
                              updatedVariants[index].title = e.target.value;
                              setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`message-${variant.id}`}>Message</Label>
                          <textarea
                            id={`message-${variant.id}`}
                            placeholder="Notification message"
                            value={variant.message}
                            onChange={(e) => {
                              const updatedVariants = [...newTest.variants];
                              updatedVariants[index].message = e.target.value;
                              setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={!newTest.name || !newTest.variants[0].title || !newTest.variants[1].title}
              >
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* A/B Tests List */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No A/B tests yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first A/B test to start optimizing your notifications
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Test
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {test.name}
                      {getStatusBadge(test.status)}
                    </CardTitle>
                    <CardDescription>
                      Testing {test.testMetric} • Target: {test.targetAudience}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.status === 'running' ? (
                      <Button size="sm" variant="outline" onClick={() => onStopTest(test.id)}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : test.status === 'draft' ? (
                      <Button size="sm" onClick={() => onStartTest(test.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Test
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  {/* Test Results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {test.variants.map((variant) => {
                      const confidence = test.variants.length === 2
                        ? calculateStatisticalSignificance(test.variants[0], test.variants[1])
                        : 0;

                      return (
                        <Card key={variant.id} className={`p-4 ${test.winner === variant.id ? 'ring-2 ring-green-500' : ''}`}>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold flex items-center">
                                {variant.name}
                                {getWinnerBadge(test, variant.id)}
                              </h4>
                              <Badge variant="outline">{variant.percentage}%</Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-medium">{variant.title}</div>
                              <div className="text-sm text-gray-600">{variant.message}</div>
                            </div>

                            {test.status !== 'draft' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500">Sent</div>
                                    <div className="font-semibold">{variant.metrics.sent.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Delivered</div>
                                    <div className="font-semibold">{variant.metrics.delivered.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Opened</div>
                                    <div className="font-semibold">{variant.metrics.opened.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Clicked</div>
                                    <div className="font-semibold">{variant.metrics.clicked.toLocaleString()}</div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Open Rate</span>
                                    <span className="font-semibold">{variant.metrics.openRate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={variant.metrics.openRate} className="h-2" />

                                  <div className="flex justify-between text-sm">
                                    <span>Click Rate</span>
                                    <span className="font-semibold">{variant.metrics.clickRate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={variant.metrics.clickRate} className="h-2" />
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Statistical Significance */}
                  {test.status === 'running' && test.variants.length === 2 && (
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 dark:text-blue-100">
                            Statistical Confidence: {calculateStatisticalSignificance(test.variants[0], test.variants[1]).toFixed(1)}%
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {calculateStatisticalSignificance(test.variants[0], test.variants[1]) >= 95
                              ? "Results are statistically significant!"
                              : "Need more data for statistical significance (95% required)"}
                          </div>
                        </div>
                        {calculateStatisticalSignificance(test.variants[0], test.variants[1]) >= 95 && (
                          <AlertCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}