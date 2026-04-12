import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OwnerCrmTabProps {
  contacts: any[];
  deals: any[];
  activityLogs: any[];
  showSecret: boolean;
}

const OwnerCrmTab = ({ contacts, deals, activityLogs, showSecret }: OwnerCrmTabProps) => (
  <div className="space-y-4">
    {/* CRM Contacts */}
    <Card>
      <CardHeader><CardTitle className="text-sm">CRM Contacts (All Users)</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Company</th>
                <th className="pb-2 font-medium">Industry</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{showSecret ? c.name : "•••"}</td>
                  <td className="py-2 text-muted-foreground">{showSecret ? (c.company || "—") : "•••"}</td>
                  <td className="py-2">
                    <Badge variant="outline" className="text-xs capitalize">{c.industry?.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="py-2">
                    <Badge variant="secondary" className="text-xs capitalize">{c.lifecycle_stage}</Badge>
                  </td>
                  <td className="py-2 text-foreground font-medium">{showSecret ? `$${c.total_revenue || 0}` : "•••"}</td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No CRM contacts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* CRM Deals */}
    <Card>
      <CardHeader><CardTitle className="text-sm">CRM Deals (All Users)</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Value</th>
                <th className="pb-2 font-medium">Probability</th>
                <th className="pb-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{showSecret ? d.title : "•••"}</td>
                  <td className="py-2">
                    <Badge variant={d.stage === "Won" ? "default" : "secondary"} className="text-xs">{d.stage}</Badge>
                  </td>
                  <td className="py-2 text-foreground font-medium">{showSecret ? `$${d.value || 0}` : "•••"}</td>
                  <td className="py-2 text-muted-foreground">{d.probability || 0}%</td>
                  <td className="py-2 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No deals yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Activity Logs */}
    <Card>
      <CardHeader><CardTitle className="text-sm">Recent Activity Logs</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Entity</th>
                <th className="pb-2 font-medium">Industry</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-2">
                    <Badge variant="outline" className="text-xs">{l.action_type}</Badge>
                  </td>
                  <td className="py-2 text-foreground capitalize">{l.entity_type}</td>
                  <td className="py-2 text-muted-foreground capitalize">{l.industry?.replace(/_/g, " ")}</td>
                  <td className="py-2 text-muted-foreground text-xs max-w-[200px] truncate">
                    {showSecret ? (l.description || "—") : "•••"}
                  </td>
                  <td className="py-2 text-muted-foreground text-xs">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {activityLogs.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No activity logs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default OwnerCrmTab;
