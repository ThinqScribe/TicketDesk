import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Bell, Save, Check } from "lucide-react";
import { getMe, updateUser } from "@/lib/api";
import type { UserRead } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Context = { user: UserRead };

export default function NotificationSettingsPage() {
  const { user } = useOutletContext<Context>();
  const token = getAccessToken()!;
  
  const [settings, setSettings] = useState({
    notify_new_tickets: user.notify_new_tickets,
    notify_ticket_updates: user.notify_ticket_updates,
    notify_comments: user.notify_comments,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const hasChanges = 
    settings.notify_new_tickets !== user.notify_new_tickets ||
    settings.notify_ticket_updates !== user.notify_ticket_updates ||
    settings.notify_comments !== user.notify_comments;

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateUser(token, user.id, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Refresh the page to update the user context
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[700px] mx-auto">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight">Notification Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your email notification preferences.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3FF]">
            <Bell className="h-5 w-5 text-[#3159E8]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#0F1B2D]">Email Notifications</h2>
            <p className="text-sm text-slate-500">Choose when you want to receive email notifications.</p>
          </div>
        </div>

        <div className="space-y-4">
          
          <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-[#3159E8] transition cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notify_new_tickets}
              onChange={(e) => setSettings(prev => ({ ...prev, notify_new_tickets: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#3159E8] focus:ring-[#3159E8] focus:ring-offset-0"
            />
            <div>
              <div className="font-medium text-[#0F1B2D]">New Tickets</div>
              <div className="text-sm text-slate-500">Get notified when new tickets are created</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-[#3159E8] transition cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notify_ticket_updates}
              onChange={(e) => setSettings(prev => ({ ...prev, notify_ticket_updates: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#3159E8] focus:ring-[#3159E8] focus:ring-offset-0"
            />
            <div>
              <div className="font-medium text-[#0F1B2D]">Ticket Updates</div>
              <div className="text-sm text-slate-500">Get notified when tickets are assigned, status changes, etc.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-[#3159E8] transition cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notify_comments}
              onChange={(e) => setSettings(prev => ({ ...prev, notify_comments: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#3159E8] focus:ring-[#3159E8] focus:ring-offset-0"
            />
            <div>
              <div className="font-medium text-[#0F1B2D]">New Comments</div>
              <div className="text-sm text-slate-500">Get notified when comments are added to tickets</div>
            </div>
          </label>

        </div>

        {hasChanges && (
          <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">You have unsaved changes</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-[#3159E8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#284DD1] transition disabled:opacity-60"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </>
              )}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}