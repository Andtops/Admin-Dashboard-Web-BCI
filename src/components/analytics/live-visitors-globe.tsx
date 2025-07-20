"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, MapPin, Activity } from "lucide-react";

// Dynamic import for Globe component to avoid SSR issues
import dynamic from "next/dynamic";

const GlobeComponent = dynamic(
  () => import("react-globe.gl").then((mod) => mod.default),
  { ssr: false }
);

interface VisitorLocation {
  lat: number;
  lng: number;
  count: number;
  country: string;
  city: string;
  visitors: Array<{
    country: string;
    city: string;
    lastSeen: number;
  }>;
  color?: string;
  activityLevel?: string;
}

export function LiveVisitorsGlobe() {
  const globeRef = useRef<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<VisitorLocation | null>(null);

  // Get live visitor data
  const liveVisitors = useQuery(api.analytics.getLiveVisitors);
  const visitorLocations = useQuery(api.analytics.getVisitorLocations);

  // Auto-rotate globe
  useEffect(() => {
    if (globeRef.current && globeReady) {
      const globe = globeRef.current;
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;
    }
  }, [globeReady]);

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return "1d+ ago";
  };

  // Get visitor point color based on recency
  const getPointColor = (lastSeen: number) => {
    const now = Date.now();
    const diff = now - lastSeen;
    const minutes = diff / (1000 * 60);
    
    if (minutes < 5) return "#22c55e"; // Green - very recent
    if (minutes < 15) return "#eab308"; // Yellow - recent
    if (minutes < 60) return "#f97316"; // Orange - somewhat recent
    return "#ef4444"; // Red - older
  };

  // Get activity level description for admin understanding
  const getActivityLevel = (lastSeen: number) => {
    const now = Date.now();
    const diff = now - lastSeen;
    const minutes = diff / (1000 * 60);
    
    if (minutes < 5) return "Very Active";
    if (minutes < 15) return "Active";
    if (minutes < 60) return "Recently Active";
    return "Less Active";
  };

  // Prepare data for globe
  const globeData = visitorLocations?.map((location) => {
    // Safety check for visitors array
    const visitors = location.visitors || [];
    const lastSeenTimes = visitors.length > 0 ? visitors.map(v => v.lastSeen) : [Date.now()];
    const maxLastSeen = Math.max(...lastSeenTimes);
    
    return {
      lat: location.lat,
      lng: location.lng,
      size: Math.max(0.4, Math.min(3.0, location.count * 0.8 + 0.6)), // Much larger, more visible markers
      color: getPointColor(maxLastSeen),
      count: location.count,
      country: location.country,
      city: location.city,
      visitors: visitors,
      // Add additional properties for better admin understanding
      activityLevel: getActivityLevel(maxLastSeen),
      totalPageViews: visitors.length, // Simplified page view count
    };
  }) || [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Globe Visualization */}
      <div className="lg:col-span-2">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Live Visitors Globe
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Real-time visitor locations around the world
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {liveVisitors?.count || 0} online
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              {typeof window !== "undefined" && (
                <div className="w-full h-full flex items-center justify-center">
                  <GlobeComponent
                    ref={globeRef}
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    pointsData={globeData}
                    pointAltitude={0.02} // Higher altitude for better visibility
                    pointRadius={(d: any) => d.size}
                    pointColor={(d: any) => d.color}
                    pointResolution={8} // Higher resolution for smoother markers
                    pointsMerge={false} // Keep individual points separate
                    pointLabel={(d: any) => `
                      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]">
                        <div class="flex items-center gap-2 mb-2">
                          <div class="w-3 h-3 rounded-full" style="background-color: ${d.color}"></div>
                          <div class="font-bold text-gray-900 dark:text-white text-base">${d.city}, ${d.country}</div>
                        </div>
                        <div class="space-y-1">
                          <div class="flex justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Visitors:</span>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white">${d.count}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white">${d.activityLevel}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Last seen:</span>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white">${d.visitors && d.visitors.length > 0 ? formatTimeAgo(Math.max(...d.visitors.map((v: any) => v.lastSeen))) : 'Just now'}</span>
                          </div>
                        </div>
                        <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div class="text-xs text-gray-500 dark:text-gray-400">Click for detailed view</div>
                        </div>
                      </div>
                    `}
                    onPointClick={(point: any) => setSelectedLocation(point)}
                    onGlobeReady={() => setGlobeReady(true)}
                    width={800}
                    height={384}
                    animateIn={true}
                  />
                </div>
              )}
              
              {/* Enhanced Legend */}
              <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Visitor Activity Guide</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                    <div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">Very Active</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Last seen &lt; 5 minutes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                    <div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">Active</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Last seen &lt; 15 minutes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
                    <div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">Recently Active</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Last seen &lt; 1 hour</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                    <div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">Less Active</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Last seen &gt; 1 hour</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    • Larger markers = More visitors<br/>
                    • Hover for details<br/>
                    • Click for full information
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Details */}
      <div className="space-y-6">
        {/* Live Stats */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Live Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Online Visitors</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {liveVisitors?.count || 0}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Locations</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {visitorLocations?.length || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Countries</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Set(visitorLocations?.map(l => l.country)).size || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visitorLocations
                ?.sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((location, index) => (
                  <div key={`${location.lat}-${location.lng}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {location.city}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {location.country}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {location.count}
                      </span>
                    </div>
                  </div>
                ))}
              
              {(!visitorLocations || visitorLocations.length === 0) && (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No active visitors at the moment
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Selected Location Details */}
        {selectedLocation && (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: selectedLocation.color }}
                ></div>
                Location Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Location Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white text-base">
                    {selectedLocation.city}, {selectedLocation.country}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </div>
                </div>

                {/* Activity Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Visitors</div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {selectedLocation.count}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">Activity Status</div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      {selectedLocation.activityLevel}
                    </div>
                  </div>
                </div>
                
                {/* Individual Visitor Details */}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Individual Visitors ({selectedLocation.visitors.length})
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedLocation.visitors.map((visitor, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Visitor #{index + 1}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-600 dark:text-gray-400">
                            {formatTimeAgo(visitor.lastSeen)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Most recent activity: {selectedLocation.visitors && selectedLocation.visitors.length > 0 
                      ? formatTimeAgo(Math.max(...selectedLocation.visitors.map(v => v.lastSeen)))
                      : 'Just now'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}