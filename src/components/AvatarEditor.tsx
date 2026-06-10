import { useState } from 'react';

export default function AvatarEditor({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(data.message)
            ? data.message[0]
            : (data.message ?? 'No se pudo guardar'),
        );
      }
      location.reload();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-20 w-20 rounded-full border-2 border-w3-primary/40 object-cover"
          />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-xl font-bold">
            {initials}
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-w3-black text-xs hover:bg-white/10"
          title="Cambiar foto"
        >
          ✎
        </button>
      </div>

      {open && (
        <div className="mt-4 w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <label className="mb-1 block text-xs text-white/50">
            URL de la imagen
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-white/15 bg-w3-black px-3 py-2 text-sm outline-none focus:border-w3-primary"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-w3-primary px-4 py-1.5 text-sm font-semibold text-w3-black disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
