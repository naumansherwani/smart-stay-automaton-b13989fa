import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Clock, Calendar, Shield, Zap, Plus, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig } from "@/lib/industryConfig";

interface ScheduleSettings {
  id?: string;
  resource_id: string;
  working_days: number[];
  working_hours_start: string;
  working_hours_end: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  max_capacity: number;
  holidays: string[];
  timezone: string;
  overbooking_allowed: boolean;
  overbooking_limit: number;
  auto_confirm: boolean;
}

interface Resource {
  id: string;
  name: string;
  industry: string;
}

interface ScheduleSettingsPanelProps {
  config: IndustryConfig;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Asia/Karachi", "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland",
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60, 90, 120, 180, 240, 480, 1440];

const ScheduleSettingsPanel = ({ config }: ScheduleSettingsPanelProps) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [settings, setSettings] = useState<ScheduleSettings>({
    resource_id: "",
    working_days: [1, 2, 3, 4, 5],
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    slot_duration_minutes: 60,
    buffer_minutes: 15,
    max_capacity: 1,
    holidays: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    overbooking_allowed: false,
    overbooking_limit: 0,
    auto_confirm: true,
  });
  const [newHoliday, setNewHoliday] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch resources
  useEffect(() => {
    if (!user) return;
    const fetchResources = async () => {
      const { data } = await supabase
        .from("resources")
        .select("id, name, industry")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (data && data.length > 0) {
        setResources(data);
        setSelectedResource(data[0].id);
      }
      setLoading(false);
    };
    fetchResources();
  }, [user]);

  // Fetch settings for selected resource
  useEffect(() => {
    if (!selectedResource || !user) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("schedule_settings")
        .select("*")
        .eq("resource_id", selectedResource)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          id: data.id,
          resource_id: data.resource_id,
          working_days: data.working_days,
          working_hours_start: data.working_hours_start,
          working_hours_end: data.working_hours_end,
          slot_duration_minutes: data.slot_duration_minutes,
          buffer_minutes: data.buffer_minutes,
          max_capacity: data.max_capacity,
          holidays: data.holidays,
          timezone: data.timezone,
          overbooking_allowed: data.overbooking_allowed,
          overbooking_limit: data.overbooking_limit,
          auto_confirm: data.auto_confirm,
        });
      } else {
        setSettings(prev => ({
          ...prev,
          id: undefined,
          resource_id: selectedResource,
        }));
      }
    };
    fetchSettings();
  }, [selectedResource, user]);

  const toggleDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  const addHoliday = () => {
    if (newHoliday && !settings.holidays.includes(newHoliday)) {
      setSettings(prev => ({ ...prev, holidays: [...prev.holidays, newHoliday].sort() }));
      setNewHoliday("");
    }
  };

  const removeHoliday = (h: string) => {
    setSettings(prev => ({ ...prev, holidays: prev.holidays.filter(d => d !== h) }));
  };

  const handleSave = async () => {
    if (!user || !selectedResource) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        resource_id: selectedResource,
        working_days: settings.working_days,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        slot_duration_minutes: settings.slot_duration_minutes,
        buffer_minutes: settings.buffer_minutes,
        max_capacity: settings.max_capacity,
        holidays: settings.holidays,
        timezone: settings.timezone,
        overbooking_allowed: settings.overbooking_allowed,
        overbooking_limit: settings.overbooking_limit,
        auto_confirm: settings.auto_confirm,
      };

      if (settings.id) {
        await supabase.from("schedule_settings").update(payload).eq("id", settings.id);
      } else {
        await supabase.from("schedule_settings").insert(payload);
      }
      toast.success("Schedule settings saved!");
    } catch (err) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading schedule settings...
        </CardContent>
      </Card>
    );
  }

  if (resources.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No {config.resourceLabelPlural} Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first {config.resourceLabel.toLowerCase()} to configure scheduling settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-primary" />
            Schedule Settings
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              <Zap className="w-3 h-3 mr-1" /> Auto-Slot Generation
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>{config.resourceLabel}</Label>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${config.resourceLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {resources.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={settings.timezone} onValueChange={v => setSettings(p => ({ ...p, timezone: v }))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Days */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Working Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((name, i) => (
                <Button
                  key={i}
                  variant={settings.working_days.includes(i) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(i)}
                  className={settings.working_days.includes(i) ? "bg-primary hover:bg-primary/90" : ""}
                >
                  {name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Working Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={settings.working_hours_start}
                  onChange={e => setSettings(p => ({ ...p, working_hours_start: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={settings.working_hours_end}
                  onChange={e => setSettings(p => ({ ...p, working_hours_end: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slot & Buffer Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Slot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Slot Duration</Label>
              <Select
                value={String(settings.slot_duration_minutes)}
                onValueChange={v => setSettings(p => ({ ...p, slot_duration_minutes: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_DURATIONS.map(d => (
                    <SelectItem key={d} value={String(d)}>
                      {d >= 60 ? `${d / 60}h` : `${d} min`}
                      {d === 1440 ? " (Full day)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Buffer Between Bookings (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={settings.buffer_minutes}
                onChange={e => setSettings(p => ({ ...p, buffer_minutes: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Max Simultaneous Capacity</Label>
              <Input
                type="number"
                min={1}
                value={settings.max_capacity}
                onChange={e => setSettings(p => ({ ...p, max_capacity: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Overbooking & Auto-confirm */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Advanced Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Auto-Confirm Bookings</Label>
                <p className="text-xs text-muted-foreground">Automatically confirm new bookings</p>
              </div>
              <Switch
                checked={settings.auto_confirm}
                onCheckedChange={v => setSettings(p => ({ ...p, auto_confirm: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Allow Overbooking</Label>
                <p className="text-xs text-muted-foreground">Accept more bookings than capacity</p>
              </div>
              <Switch
                checked={settings.overbooking_allowed}
                onCheckedChange={v => setSettings(p => ({ ...p, overbooking_allowed: v }))}
              />
            </div>
            {settings.overbooking_allowed && (
              <div>
                <Label className="text-xs">Overbooking Limit (extra slots)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.overbooking_limit}
                  onChange={e => setSettings(p => ({ ...p, overbooking_limit: Number(e.target.value) }))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holidays */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-destructive" />
            Holidays & Blocked Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              type="date"
              value={newHoliday}
              onChange={e => setNewHoliday(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addHoliday}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.holidays.length === 0 && (
              <p className="text-xs text-muted-foreground">No holidays configured</p>
            )}
            {settings.holidays.map(h => (
              <Badge key={h} variant="secondary" className="gap-1">
                {new Date(h + "T00:00:00").toLocaleDateString()}
                <button onClick={() => removeHoliday(h)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary hover:opacity-90">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Schedule Settings"}
      </Button>
    </div>
  );
};

export default ScheduleSettingsPanel;
