import { ApiKeyConfig } from '@/components/ui/api-key-config';

export default async function SettingsPage() {
  return (
    <div className="grid gap-6">
      <ApiKeyConfig />
    </div>
  );
}