import { useEffect, useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getSettings, updateSettings } from '@/lib/settings';
import type { UserSettings } from '@/lib/types';
import { TONES } from '@/lib/types';
import { useToast } from '@/components/Toast';

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'claude-3-5-sonnet', 'gemini-1.5-pro'];

export function Settings() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getSettings(user.id)
      .then(setSettings)
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user || !settings) return;
    setSaving(true);
    try {
      const updated = await updateSettings(user.id, {
        default_tone: settings.default_tone,
        ai_model: settings.ai_model,
        theme: settings.theme,
        auto_save: settings.auto_save,
        auto_reply: settings.auto_reply,
        notifications: settings.notifications,
        signature: settings.signature,
      });
      if (updated) setSettings(updated);
      notify('Settings saved', 'success');
    } catch {
      notify('Could not save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center gap-2 text-ink-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-ink-400">Personalize your AI assistant.</p>
      </div>

      <div className="card divide-y divide-ink-800">
        <Field label="Default tone" hint="Used when generating a new reply.">
          <select
            value={settings.default_tone}
            onChange={(e) => setSettings({ ...settings, default_tone: e.target.value })}
            className="input max-w-xs"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="AI model" hint="OpenAI-compatible model used for generation.">
          <select
            value={settings.ai_model}
            onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
            className="input max-w-xs"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Theme" hint="Dark or light interface.">
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ ...settings, theme: t })}
                className={`chip capitalize ${
                  settings.theme === t
                    ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                    : 'border-ink-700 text-ink-400'
                }`}
              >
                {t === 'dark' ? <Check size={12} /> : null}
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Auto-save replies" hint="Save every generated reply to history automatically.">
          <Toggle on={settings.auto_save} onClick={() => setSettings({ ...settings, auto_save: !settings.auto_save })} />
        </Field>

        <Field label="Auto-reply draft" hint="Automatically draft an AI reply when you open an email.">
          <Toggle on={settings.auto_reply} onClick={() => setSettings({ ...settings, auto_reply: !settings.auto_reply })} />
        </Field>

        <Field label="Notifications" hint="Show in-app notifications for new emails and sent replies.">
          <Toggle on={settings.notifications} onClick={() => setSettings({ ...settings, notifications: !settings.notifications })} />
        </Field>

        <Field label="Signature" hint="Appended to the end of every generated reply.">
          <textarea
            value={settings.signature}
            onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
            rows={4}
            placeholder="Best regards,&#10;Your Name&#10;Your Title"
            className="input resize-y"
          />
        </Field>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary mt-5">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save settings
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5">
      <p className="text-sm font-semibold text-white">{label}</p>
      {hint && <p className="text-xs text-ink-500 mt-0.5">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-brand-600' : 'bg-ink-700'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}
