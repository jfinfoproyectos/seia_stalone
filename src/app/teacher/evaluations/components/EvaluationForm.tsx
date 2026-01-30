import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface Evaluation {
  id?: number;
  title: string;
  description?: string;
  helpUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  maxSupportAttempts?: number;
}

interface EvaluationFormProps {
  evaluation?: Evaluation;
  onSave: (evaluation: Evaluation) => void;
  onCancel: () => void;
}

export function EvaluationForm({ evaluation, onSave, onCancel }: EvaluationFormProps) {
  const [title, setTitle] = useState(evaluation?.title || '');
  const [description, setDescription] = useState(evaluation?.description || '');
  const [helpUrl, setHelpUrl] = useState(evaluation?.helpUrl || '');
  const [maxSupportAttempts, setMaxSupportAttempts] = useState(evaluation?.maxSupportAttempts ?? 3);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave({ ...evaluation, title, description, helpUrl, maxSupportAttempts });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block mb-1 font-medium">Título</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="block mb-1 font-medium">Descripción</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1 font-medium">URL de ayuda</label>
        <Input value={helpUrl} onChange={e => setHelpUrl(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1 font-medium">
          Intentos máximos de ayuda por IA (por pregunta)
          <span className="text-xs text-muted-foreground ml-2">(Máximo 10)</span>
        </label>
        <Input
          type="number"
          min="0"
          max="10"
          value={maxSupportAttempts}
          onChange={e => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val >= 0 && val <= 10) {
              setMaxSupportAttempts(val);
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Define cuántas veces un estudiante puede solicitar evaluación/ayuda a la IA para una misma pregunta.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
} 