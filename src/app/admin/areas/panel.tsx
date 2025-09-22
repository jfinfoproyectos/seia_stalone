"use client";
import { useState, useTransition } from 'react';
import { createArea, updateArea, deleteArea } from './actions';
import { Button } from '@/components/ui/button';


export default function AreaPanel({ areas }: { areas: { id: number, name: string }[] }) {
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async () => {
    setError('');
    startTransition(async () => {
      const res = await createArea(name);
      if (res.error) setError(res.error);
      else window.location.reload();
    });
  };

  const handleEdit = async () => {
    if (!editId) return;
    setError('');
    startTransition(async () => {
      const res = await updateArea(editId, editName);
      if (res.error) setError(res.error);
      else window.location.reload();
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setError('');
    setOpenDelete(false);
    startTransition(async () => {
      const res = await deleteArea(deleteId);
      if (res.error) setError(res.error);
      else window.location.reload();
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Áreas</h1>
      <div className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1 bg-background text-foreground"
          placeholder="Nueva área"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isPending}
        />
        <Button onClick={handleCreate} disabled={isPending || !name.trim()}>Crear</Button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ul className="divide-y border rounded-lg bg-card">
        {areas.map(area => (
          <li key={area.id} className="flex items-center justify-between px-4 py-2">
            <span>{area.name}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditId(area.id); setEditName(area.name); setOpenEdit(true); }}>Editar</Button>
              <Button size="sm" variant="destructive" onClick={() => { setDeleteId(area.id); setOpenDelete(true); }}>Eliminar</Button>
            </div>
          </li>
        ))}
      </ul>
      {/* Modal editar flotante moderno */}
      {openEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setOpenEdit(false)}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de área con animación */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Editar Área
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Modifica el nombre del área
                    </p>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={() => setOpenEdit(false)}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                  aria-label="Cerrar edición"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido principal */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nombre del área</label>
                  <input
                    className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    disabled={isPending}
                    placeholder="Ingresa el nombre del área"
                  />
                </div>
              </div>
            </div>
            
            {/* Barra inferior con botones de acción */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <button
                onClick={() => setOpenEdit(false)}
                disabled={isPending}
                className="px-4 py-2 bg-muted/50 hover:bg-muted border border-border/30 hover:border-border/50 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleEdit}
                disabled={isPending || !editName.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                {isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal eliminar flotante moderno */}
      {openDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setOpenDelete(false)}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente de advertencia */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de advertencia con animación */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h1 className="text-xl font-bold text-destructive">
                      ¿Eliminar área?
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={() => setOpenDelete(false)}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                  aria-label="Cerrar confirmación"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido principal */}
            <div className="px-6 py-4">
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-sm text-foreground leading-relaxed">
                  No podrás eliminar un área si tiene profesores asociados.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  ¿Deseas continuar?
                </p>
              </div>
            </div>
            
            {/* Barra inferior con botones de acción */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <button
                onClick={() => setOpenDelete(false)}
                disabled={isPending}
                className="px-4 py-2 bg-muted/50 hover:bg-muted border border-border/30 hover:border-border/50 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                {isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}