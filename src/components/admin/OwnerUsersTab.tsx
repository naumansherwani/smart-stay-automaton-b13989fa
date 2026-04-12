import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OwnerUsersTabProps {
  recentUsers: any[];
  showSecret: boolean;
}

const OwnerUsersTab = ({ recentUsers, showSecret }: OwnerUsersTabProps) => (
  <Card>
    <CardHeader><CardTitle className="text-sm">Recent Users</CardTitle></CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Company</th>
              <th className="pb-2 font-medium">Industry</th>
              <th className="pb-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2 text-foreground">{showSecret ? u.display_name : "•••"}</td>
                <td className="py-2 text-muted-foreground">{showSecret ? (u.company_name || "—") : "•••"}</td>
                <td className="py-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {u.industry?.replace(/_/g, " ") || "—"}
                  </Badge>
                </td>
                <td className="py-2 text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

export default OwnerUsersTab;
