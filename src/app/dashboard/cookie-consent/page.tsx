"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Cookie,
  Users,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Eye,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Filter,
  RefreshCw,
  Database,
  UserX
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { format } from "date-fns";

export default function CookieConsentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsent, setSelectedConsent] = useState<any>(null);
  const [includeAnonymous, setIncludeAnonymous] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Queries with refresh mechanism
  const consentStats = useQuery(api.cookieConsents.getConsentStatsFiltered, { 
    includeAnonymous
  });
  const allConsents = useQuery(api.cookieConsents.getAllConsents, { 
    limit: 50, 
    includeAnonymous
  });

  // Auto-refresh every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setShouldRefresh(prev => !prev);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    setShouldRefresh(prev => !prev);
    // Force re-render by updating a state that triggers query refresh
    window.location.reload();
  };

  // Filter consents based on search term
  const filteredConsents = allConsents?.consents?.filter(consent =>
    consent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (consent.anonymousId && consent.anonymousId.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getConsentMethodBadge = (method: string) => {
    const variants = {
      banner_accept_all: "default",
      banner_essential_only: "secondary",
      banner_custom: "outline",
      settings_page: "destructive"
    } as const;
    
    const labels = {
      banner_accept_all: "Accept All",
      banner_essential_only: "Essential Only",
      banner_custom: "Custom",
      settings_page: "Settings"
    };

    return (
      <Badge variant={variants[method as keyof typeof variants] || "outline"}>
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  const getPreferenceBadge = (enabled: boolean, type: string) => {
    return (
      <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
        {type}: {enabled ? "✓" : "✗"}
      </Badge>
    );
  };

  const getUserDisplayName = (consent: any) => {
    if (consent.isAnonymous) {
      return `Anonymous User (${consent.anonymousId?.substring(0, 8)}...)`;
    }
    return `${consent.firstName} ${consent.lastName}`;
  };

  const getEmailDisplay = (consent: any) => {
    if (consent.isAnonymous) {
      return `Anonymous (${consent.anonymousId?.substring(0, 8)}...)`;
    }
    return consent.email;
  };

  return (
    <ProtectedRoute requiredPermission="cookie-consent:read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Cookie className="h-8 w-8" />
                Cookie Consent Management
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage user cookie consent preferences (including anonymous users)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Active Consents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consentStats?.totalActive || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All user consents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consentStats?.totalRegistered || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Logged-in users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anonymous Users</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consentStats?.totalAnonymous || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Before login/signup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics Enabled</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consentStats?.preferences?.analytics?.percentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {consentStats?.preferences?.analytics?.enabled || 0} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consentStats?.expiringSoon || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Within 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="consents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="consents">All Consents</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="consents" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Cookie Consent Records</CardTitle>
                  <CardDescription>
                    View and manage all user cookie consent preferences (including anonymous users)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email, name, or anonymous ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Include Anonymous:</label>
                      <input
                        type="checkbox"
                        checked={includeAnonymous}
                        onChange={(e) => setIncludeAnonymous(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>

                  {/* Consents Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email/ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Preferences</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredConsents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
                              <Cookie className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No cookie consent records found</p>
                              <p className="text-sm text-muted-foreground">
                                Records will appear as users interact with the cookie banner
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredConsents.map((consent) => (
                            <TableRow key={consent.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {getUserDisplayName(consent)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {getEmailDisplay(consent)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={consent.isAnonymous ? "secondary" : "default"}>
                                  {consent.isAnonymous ? "Anonymous" : "Registered"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {getPreferenceBadge(consent.preferences.analytics, "Analytics")}
                                  {getPreferenceBadge(consent.preferences.marketing, "Marketing")}
                                  {getPreferenceBadge(consent.preferences.functional, "Functional")}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getConsentMethodBadge(consent.consentMethod)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {consent.isActive ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span className="text-sm text-green-600">Active</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      <span className="text-sm text-red-600">Inactive</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(consent.consentTimestamp), "MMM dd, yyyy")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(consent.consentTimestamp), "HH:mm")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(consent.expiresAt), "MMM dd, yyyy")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedConsent(consent)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Cookie Consent Details</DialogTitle>
                                      <DialogDescription>
                                        Detailed information about this user's cookie consent
                                      </DialogDescription>
                                    </DialogHeader>
                                    {selectedConsent && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium">User</label>
                                            <p className="text-sm text-muted-foreground">
                                              {getUserDisplayName(selectedConsent)}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Email/ID</label>
                                            <p className="text-sm text-muted-foreground">
                                              {getEmailDisplay(selectedConsent)}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">User Type</label>
                                            <div className="mt-1">
                                              <Badge variant={selectedConsent.isAnonymous ? "secondary" : "default"}>
                                                {selectedConsent.isAnonymous ? "Anonymous User" : "Registered User"}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Consent Method</label>
                                            <div className="mt-1">
                                              {getConsentMethodBadge(selectedConsent.consentMethod)}
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Status</label>
                                            <div className="flex items-center gap-2 mt-1">
                                              {selectedConsent.isActive ? (
                                                <>
                                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                                  <span className="text-sm text-green-600">Active</span>
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle className="h-4 w-4 text-red-500" />
                                                  <span className="text-sm text-red-600">Inactive</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <label className="text-sm font-medium">Cookie Preferences</label>
                                          <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="flex items-center justify-between p-2 border rounded">
                                              <span className="text-sm">Essential</span>
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div className="flex items-center justify-between p-2 border rounded">
                                              <span className="text-sm">Analytics</span>
                                              {selectedConsent.preferences.analytics ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                              )}
                                            </div>
                                            <div className="flex items-center justify-between p-2 border rounded">
                                              <span className="text-sm">Marketing</span>
                                              {selectedConsent.preferences.marketing ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                              )}
                                            </div>
                                            <div className="flex items-center justify-between p-2 border rounded">
                                              <span className="text-sm">Functional</span>
                                              {selectedConsent.preferences.functional ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium">Consent Date</label>
                                            <p className="text-sm text-muted-foreground">
                                              {format(new Date(selectedConsent.consentTimestamp), "PPpp")}
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium">Expires</label>
                                            <p className="text-sm text-muted-foreground">
                                              {format(new Date(selectedConsent.expiresAt), "PPpp")}
                                            </p>
                                          </div>
                                        </div>

                                        {selectedConsent.ipAddress && (
                                          <div>
                                            <label className="text-sm font-medium">IP Address</label>
                                            <p className="text-sm text-muted-foreground font-mono">
                                              {selectedConsent.ipAddress}
                                            </p>
                                          </div>
                                        )}

                                        {selectedConsent.anonymousId && (
                                          <div>
                                            <label className="text-sm font-medium">Anonymous ID</label>
                                            <p className="text-sm text-muted-foreground font-mono">
                                              {selectedConsent.anonymousId}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* User Type Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Type Breakdown</CardTitle>
                    <CardDescription>
                      Distribution of registered vs anonymous users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Registered Users</span>
                          <span className="text-sm text-muted-foreground">
                            {consentStats?.totalRegistered || 0} ({Math.round(((consentStats?.totalRegistered || 0) / (consentStats?.totalActive || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.round(((consentStats?.totalRegistered || 0) / (consentStats?.totalActive || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Anonymous Users</span>
                          <span className="text-sm text-muted-foreground">
                            {consentStats?.totalAnonymous || 0} ({Math.round(((consentStats?.totalAnonymous || 0) / (consentStats?.totalActive || 1)) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${Math.round(((consentStats?.totalAnonymous || 0) / (consentStats?.totalActive || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consent Methods Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Consent Methods</CardTitle>
                    <CardDescription>
                      How users are providing consent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {consentStats?.consentMethods && Object.entries(consentStats.consentMethods).map(([method, count]) => (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getConsentMethodBadge(method)}
                          </div>
                          <div className="text-sm font-medium">{count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences Breakdown */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Preference Breakdown</CardTitle>
                    <CardDescription>
                      Cookie category acceptance rates across all users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Analytics</span>
                          <span className="text-sm text-muted-foreground">
                            {consentStats?.preferences?.analytics?.percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${consentStats?.preferences?.analytics?.percentage || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {consentStats?.preferences?.analytics?.enabled || 0} users
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Marketing</span>
                          <span className="text-sm text-muted-foreground">
                            {consentStats?.preferences?.marketing?.percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${consentStats?.preferences?.marketing?.percentage || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {consentStats?.preferences?.marketing?.enabled || 0} users
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Functional</span>
                          <span className="text-sm text-muted-foreground">
                            {consentStats?.preferences?.functional?.percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${consentStats?.preferences?.functional?.percentage || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {consentStats?.preferences?.functional?.enabled || 0} users
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cookie Consent Settings</CardTitle>
                  <CardDescription>
                    Configure cookie consent behavior and compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Anonymous User Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Track consent for users before they register or login
                        </p>
                      </div>
                      <Badge variant="default">
                        <UserX className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">GDPR Compliance</h4>
                        <p className="text-sm text-muted-foreground">
                          Ensure all consents are GDPR compliant
                        </p>
                      </div>
                      <Badge variant="default">
                        <Shield className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Consent Expiration</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically expire consents after 1 year
                        </p>
                      </div>
                      <Badge variant="default">
                        <Calendar className="h-3 w-3 mr-1" />
                        365 days
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Data Retention</h4>
                        <p className="text-sm text-muted-foreground">
                          Keep consent records for compliance
                        </p>
                      </div>
                      <Badge variant="default">
                        <Database className="h-3 w-3 mr-1" />
                        Indefinite
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">User Linking</h4>
                        <p className="text-sm text-muted-foreground">
                          Link anonymous consent to user accounts when they register
                        </p>
                      </div>
                      <Badge variant="default">
                        <Users className="h-3 w-3 mr-1" />
                        Automatic
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}