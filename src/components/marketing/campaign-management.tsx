"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Plus,
    Target,
    Send,
    Calendar as CalendarIcon,
    Clock,
    Users,
    TrendingUp,
    Eye,
    Edit,
    Trash2,
    Play,
    Pause,
    Copy,
    BarChart3,
    Zap,
    Filter,
    Download
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Campaign {
    id: string;
    name: string;
    type: 'push' | 'email' | 'sms';
    status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
    targetAudience: string;
    segmentRules: any[];
    abTest?: {
        enabled: boolean;
        variants: Array<{
            id: string;
            name: string;
            title: string;
            message: string;
            percentage: number;
        }>;
    };
    schedule: {
        type: 'immediate' | 'scheduled' | 'recurring';
        scheduledFor?: Date;
        recurring?: {
            frequency: 'daily' | 'weekly' | 'monthly';
            interval: number;
            endDate?: Date;
        };
    };
    content: {
        title: string;
        message: string;
        imageUrl?: string;
        actionUrl?: string;
    };
    analytics: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

interface CampaignManagementProps {
    campaigns: Campaign[];
    onCreateCampaign: (campaign: Partial<Campaign>) => Promise<void>;
    onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
    onDeleteCampaign: (id: string) => Promise<void>;
    onLaunchCampaign: (id: string) => Promise<void>;
}

export function CampaignManagement({
    campaigns,
    onCreateCampaign,
    onUpdateCampaign,
    onDeleteCampaign,
    onLaunchCampaign
}: CampaignManagementProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterType, setFilterType] = useState<string>("all");

    const [newCampaign, setNewCampaign] = useState<{
        name: string;
        type: 'push' | 'email' | 'sms';
        targetAudience: string;
        content: {
            title: string;
            message: string;
            imageUrl: string;
            actionUrl: string;
        };
        schedule: {
            type: 'immediate' | 'scheduled' | 'recurring';
            scheduledFor: Date | undefined;
        };
        abTest: {
            enabled: boolean;
            variants: Array<{
                id: string;
                name: string;
                title: string;
                message: string;
                percentage: number;
            }>;
        };
        segmentRules: any[];
    }>({
        name: "",
        type: "push",
        targetAudience: "all_users",
        content: {
            title: "",
            message: "",
            imageUrl: "",
            actionUrl: ""
        },
        schedule: {
            type: "immediate",
            scheduledFor: undefined
        },
        abTest: {
            enabled: false,
            variants: [
                { id: "A", name: "Variant A", title: "", message: "", percentage: 50 },
                { id: "B", name: "Variant B", title: "", message: "", percentage: 50 }
            ]
        },
        segmentRules: []
    });

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesStatus = filterStatus === "all" || campaign.status === filterStatus;
        const matchesType = filterType === "all" || campaign.type === filterType;
        return matchesStatus && matchesType;
    });

    const handleCreateCampaign = async () => {
        try {
            await onCreateCampaign({
                name: newCampaign.name,
                type: newCampaign.type,
                targetAudience: newCampaign.targetAudience,
                content: newCampaign.content,
                schedule: newCampaign.schedule,
                abTest: newCampaign.abTest.enabled ? newCampaign.abTest : undefined,
                segmentRules: newCampaign.segmentRules,
                status: newCampaign.schedule.type === "immediate" ? "running" : "scheduled"
            });

            setIsCreateDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error creating campaign:', error);
        }
    };

    const resetForm = () => {
        setNewCampaign({
            name: "",
            type: "push",
            targetAudience: "all_users",
            content: { title: "", message: "", imageUrl: "", actionUrl: "" },
            schedule: { type: "immediate", scheduledFor: undefined },
            abTest: {
                enabled: false,
                variants: [
                    { id: "A", name: "Variant A", title: "", message: "", percentage: 50 },
                    { id: "B", name: "Variant B", title: "", message: "", percentage: 50 }
                ]
            },
            segmentRules: []
        });
    };
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "running":
                return <Badge className="bg-green-100 text-green-700">Running</Badge>;
            case "draft":
                return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
            case "scheduled":
                return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
            case "completed":
                return <Badge className="bg-purple-100 text-purple-700">Completed</Badge>;
            case "paused":
                return <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "push":
                return <Target className="h-4 w-4" />;
            case "email":
                return <Send className="h-4 w-4" />;
            case "sms":
                return <Users className="h-4 w-4" />;
            default:
                return <Target className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Management</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create and manage marketing campaigns with A/B testing and advanced targeting
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Campaign
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Campaign</DialogTitle>
                                <DialogDescription>
                                    Set up a new marketing campaign with advanced targeting and A/B testing
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                    <TabsTrigger value="content">Content</TabsTrigger>
                                    <TabsTrigger value="targeting">Targeting</TabsTrigger>
                                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                                </TabsList>
                                <TabsContent value="basic" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="campaignName">Campaign Name</Label>
                                            <Input
                                                id="campaignName"
                                                placeholder="e.g., Welcome Series"
                                                value={newCampaign.name}
                                                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="campaignType">Campaign Type</Label>
                                            <Select
                                                value={newCampaign.type}
                                                onValueChange={(value: 'push' | 'email' | 'sms') =>
                                                    setNewCampaign(prev => ({ ...prev, type: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="push">Push Notification</SelectItem>
                                                    <SelectItem value="email">Email</SelectItem>
                                                    <SelectItem value="sms">SMS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="targetAudience">Target Audience</Label>
                                        <Select
                                            value={newCampaign.targetAudience}
                                            onValueChange={(value) => setNewCampaign(prev => ({ ...prev, targetAudience: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all_users">All Users</SelectItem>
                                                <SelectItem value="new_users">New Users</SelectItem>
                                                <SelectItem value="active_users">Active Users</SelectItem>
                                                <SelectItem value="ios_users">iOS Users</SelectItem>
                                                <SelectItem value="android_users">Android Users</SelectItem>
                                                <SelectItem value="custom">Custom Segment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>

                                <TabsContent value="content" className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contentTitle">Title</Label>
                                            <Input
                                                id="contentTitle"
                                                placeholder="Notification title"
                                                value={newCampaign.content.title}
                                                onChange={(e) => setNewCampaign(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, title: e.target.value }
                                                }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="contentMessage">Message</Label>
                                            <textarea
                                                id="contentMessage"
                                                placeholder="Notification message"
                                                value={newCampaign.content.message}
                                                onChange={(e) => setNewCampaign(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, message: e.target.value }
                                                }))}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                                                <Input
                                                    id="imageUrl"
                                                    placeholder="https://example.com/image.jpg"
                                                    value={newCampaign.content.imageUrl}
                                                    onChange={(e) => setNewCampaign(prev => ({
                                                        ...prev,
                                                        content: { ...prev.content, imageUrl: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                                                <Input
                                                    id="actionUrl"
                                                    placeholder="https://example.com/action"
                                                    value={newCampaign.content.actionUrl}
                                                    onChange={(e) => setNewCampaign(prev => ({
                                                        ...prev,
                                                        content: { ...prev.content, actionUrl: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* A/B Testing Section */}
                                    <div className="border-t pt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="font-semibold">A/B Testing</h4>
                                                <p className="text-sm text-gray-600">Test different versions of your content</p>
                                            </div>
                                            <Switch
                                                checked={newCampaign.abTest.enabled}
                                                onCheckedChange={(checked) => setNewCampaign(prev => ({
                                                    ...prev,
                                                    abTest: { ...prev.abTest, enabled: checked }
                                                }))}
                                            />
                                        </div>

                                        {newCampaign.abTest.enabled && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {newCampaign.abTest.variants.map((variant, index) => (
                                                    <Card key={variant.id} className="p-4">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className="font-medium">{variant.name}</h5>
                                                                <Badge variant="outline">{variant.percentage}%</Badge>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Input
                                                                    placeholder="Variant title"
                                                                    value={variant.title}
                                                                    onChange={(e) => {
                                                                        const updatedVariants = [...newCampaign.abTest.variants];
                                                                        updatedVariants[index].title = e.target.value;
                                                                        setNewCampaign(prev => ({
                                                                            ...prev,
                                                                            abTest: { ...prev.abTest, variants: updatedVariants }
                                                                        }));
                                                                    }}
                                                                />
                                                                <textarea
                                                                    placeholder="Variant message"
                                                                    value={variant.message}
                                                                    onChange={(e) => {
                                                                        const updatedVariants = [...newCampaign.abTest.variants];
                                                                        updatedVariants[index].message = e.target.value;
                                                                        setNewCampaign(prev => ({
                                                                            ...prev,
                                                                            abTest: { ...prev.abTest, variants: updatedVariants }
                                                                        }));
                                                                    }}
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="targeting" className="space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Audience Targeting</h4>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Define specific criteria for your target audience
                                            </p>
                                        </div>

                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h5 className="font-medium">Segment Rules</h5>
                                            <div className="text-sm text-gray-600">
                                                Advanced targeting rules will be available in the next update.
                                                Currently using basic audience selection from the Basic Info tab.
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="schedule" className="space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Campaign Schedule</h4>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Choose when to send your campaign
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Schedule Type</Label>
                                                <Select
                                                    value={newCampaign.schedule.type}
                                                    onValueChange={(value: 'immediate' | 'scheduled' | 'recurring') =>
                                                        setNewCampaign(prev => ({
                                                            ...prev,
                                                            schedule: { ...prev.schedule, type: value }
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="immediate">Send Immediately</SelectItem>
                                                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                                                        <SelectItem value="recurring">Recurring Campaign</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {newCampaign.schedule.type === 'scheduled' && (
                                                <div className="space-y-2">
                                                    <Label>Scheduled Date & Time</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !newCampaign.schedule.scheduledFor && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {newCampaign.schedule.scheduledFor ? (
                                                                    format(newCampaign.schedule.scheduledFor, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <Calendar
                                                                mode="single"
                                                                selected={newCampaign.schedule.scheduledFor}
                                                                onSelect={(date) => setNewCampaign(prev => ({
                                                                    ...prev,
                                                                    schedule: { ...prev.schedule, scheduledFor: date }
                                                                }))}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            )}

                                            {newCampaign.schedule.type === 'recurring' && (
                                                <div className="space-y-4 p-4 border rounded-lg">
                                                    <h5 className="font-medium">Recurring Settings</h5>
                                                    <div className="text-sm text-gray-600">
                                                        Recurring campaign options will be available in the next update.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateCampaign}
                                    disabled={!newCampaign.name || !newCampaign.content.title || !newCampaign.content.message}
                                >
                                    Create Campaign
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="push">Push Notifications</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Campaigns List */}
            {filteredCampaigns.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No campaigns found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Create your first campaign to start engaging with your audience
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Campaign
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => (
                        <Card key={campaign.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                            {getTypeIcon(campaign.type)}
                                        </div>
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {campaign.name}
                                                {getStatusBadge(campaign.status)}
                                            </CardTitle>
                                            <CardDescription>
                                                {campaign.type.toUpperCase()} • Target: {campaign.targetAudience} •
                                                Created {format(campaign.createdAt, "MMM d, yyyy")}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {campaign.status === 'draft' && (
                                            <Button size="sm" onClick={() => onLaunchCampaign(campaign.id)}>
                                                <Play className="h-4 w-4 mr-2" />
                                                Launch
                                            </Button>
                                        )}
                                        {campaign.status === 'running' && (
                                            <Button size="sm" variant="outline" onClick={() => onUpdateCampaign(campaign.id, { status: 'paused' })}>
                                                <Pause className="h-4 w-4 mr-2" />
                                                Pause
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => onDeleteCampaign(campaign.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-4">
                                    {/* Campaign Content Preview */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="font-medium text-sm mb-1">{campaign.content.title}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{campaign.content.message}</div>
                                    </div>

                                    {/* Campaign Analytics */}
                                    {campaign.status !== 'draft' && (
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{campaign.analytics.sent.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Sent</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{campaign.analytics.delivered.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Delivered</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">{campaign.analytics.opened.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Opened</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-orange-600">{campaign.analytics.clicked.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Clicked</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-red-600">{campaign.analytics.converted.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Converted</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* A/B Test Results */}
                                    {campaign.abTest?.enabled && campaign.status !== 'draft' && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4" />
                                                A/B Test Results
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {campaign.abTest.variants.map((variant) => (
                                                    <div key={variant.id} className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium">{variant.name}</span>
                                                            <Badge variant="outline">{variant.percentage}%</Badge>
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="font-medium">{variant.title}</div>
                                                            <div className="text-gray-600">{variant.message}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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