"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type DisplayUser, deleteUser, updateUserFull } from "../actions";
import { useTransition, useState, useEffect } from "react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Area {
  id: number;
  name: string;
}

interface UserTableProps {
  users?: DisplayUser[];
  areas: Area[];
}

export function UserTable({ users = [], areas }: UserTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editUser, setEditUser] = useState<DisplayUser | null>(null);
  const [editAreaId, setEditAreaId] = useState<string>('');
  const [editIdentification, setEditIdentification] = useState<string>("");
  const [editFirstName, setEditFirstName] = useState<string>("");
  const [editLastName, setEditLastName] = useState<string>("");

  const [editEvaluationLimit, setEditEvaluationLimit] = useState<number>(5);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filteredUsers, setFilteredUsers] = useState<DisplayUser[]>(users);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filterArea || filterArea === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => String(u.areaId) === filterArea));
    }
  }, [filterArea, users]);

  if (!Array.isArray(users)) {
    return <div className="text-red-500">Error: usuarios no válidos.</div>;
  }
  if (users.length === 0) {
    return <div className="text-muted-foreground p-4">No hay usuarios registrados.</div>;
  }

  const handleDelete = (userId: string) => {
    setDeleteUserId(userId);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    if (!deleteUserId) return;
    setOpenDelete(false);
    startTransition(() => {
      deleteUser(deleteUserId);
    });
    setDeleteUserId(null);
  };

  const openEditModal = (user: DisplayUser) => {
    setEditUser(user);
    setEditAreaId(user.areaId ? String(user.areaId) : 'none');
    setEditIdentification(user.identification || '');
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');

    setEditEvaluationLimit(user.evaluationLimit);
    setOpen(true);
  };

  const closeEditModal = () => {
    setEditUser(null);
    setEditAreaId('none');
    setEditIdentification("");
    setEditFirstName("");
    setEditLastName("");

    setEditEvaluationLimit(5);
    setOpen(false);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    const data = await updateUserFull({
      id: String(editUser.id),
      firstName: editFirstName,
      lastName: editLastName,
      areaId: editUser.role === 'TEACHER' && editAreaId && editAreaId !== 'none' ? Number(editAreaId) : null,
      identification: editIdentification || null,

      evaluationLimit: editUser.role === 'TEACHER' ? editEvaluationLimit : undefined,
    });
    if (!data.success) {
      setError(data.error || 'Error al actualizar el usuario.');
      setSaving(false);
      return;
    }
    setSaving(false);
    closeEditModal();
    window.location.reload();
  };

  return (
    <div className="border rounded-lg w-full overflow-x-auto">
      <div className="flex items-center gap-2 p-4">
        <label className="font-medium">Filtrar por área:</label>
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {areas.map(area => (
              <SelectItem key={String(area.id)} value={String(area.id)}>{area.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Identificación</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Fecha de Registro</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={String(user.id)}>
              <TableCell>{user.firstName || ''}</TableCell>
              <TableCell>{user.lastName || ''}</TableCell>
              <TableCell>{user.identification || <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{user.email || ''}</TableCell>
              <TableCell>
                {areas.find(a => a.id === user.areaId)?.name || <span className="text-muted-foreground">Sin área</span>}
              </TableCell>
              <TableCell>
                {user.createdAt ? format(new Date(user.createdAt), "d 'de' MMMM, yyyy", { locale: es }) : ''}
              </TableCell>
              <TableCell className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => openEditModal(user)} disabled={isPending}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(String(user.id))} disabled={isPending} title="Eliminar usuario (solo base de datos local)">
                  {isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Modal de edición flotante moderno */}
      {open && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con efecto blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={closeEditModal}
          />
          
          {/* Contenedor principal flotante */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Barra superior con gradiente */}
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {/* Indicador de usuario con animación */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Editar Usuario
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {editUser.role === 'TEACHER' ? 'Profesor' : 'Administrador'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {editUser.email}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botón cerrar elegante */}
                <button
                  onClick={closeEditModal}
                  className="group relative w-10 h-10 rounded-xl bg-muted/50 hover:bg-destructive/10 border border-border/50 hover:border-destructive/30 transition-all duration-200 flex items-center justify-center"
                  aria-label="Cerrar edición"
                >
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenido principal con scroll personalizado */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="relative">
                {/* Decoración de fondo */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl" />
                
                {/* Contenedor del contenido */}
                <div className="relative bg-gradient-to-br from-muted/30 via-background/50 to-muted/20 border border-border/30 rounded-xl p-8 backdrop-blur-sm">
                  {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="space-y-8">
                    {/* Datos personales */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Datos personales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            value={editFirstName || ''}
                            onChange={e => setEditFirstName(e.target.value)}
                            disabled={saving}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Apellido</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            value={editLastName || ''}
                            onChange={e => setEditLastName(e.target.value)}
                            disabled={saving}
                            required
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Identificación (opcional)</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            value={editIdentification || ''}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              setEditIdentification(val);
                            }}
                            disabled={saving}
                            placeholder="Solo números"
                            maxLength={32}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {editUser?.role === 'TEACHER' && (
                      <>
                        {/* Datos institucionales */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Datos institucionales</h3>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Área</label>
                            <Select value={editAreaId || 'none'} onValueChange={setEditAreaId} disabled={saving}>
                              <SelectTrigger className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg">
                                <SelectValue placeholder="Sin área" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin área</SelectItem>
                                {areas.map(area => (
                                  <SelectItem key={String(area.id)} value={String(area.id)}>{area.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        

                        
                        {/* Límites */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-2">Límites</h3>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Límite de Evaluaciones</label>
                            <input
                              type="number"
                              className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                              value={editEvaluationLimit}
                              onChange={e => setEditEvaluationLimit(Number(e.target.value))}
                              disabled={saving}
                              min="0"
                            />
                            <p className="text-xs text-muted-foreground">
                              Número de evaluaciones que este profesor puede crear.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Barra inferior con botones de acción */}
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/20 rounded-b-2xl">
              <div className="text-sm text-muted-foreground">
                Editando usuario: {editUser.firstName} {editUser.lastName}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-4 py-2 bg-muted/50 hover:bg-muted border border-border/30 hover:border-border/50 rounded-xl transition-all duration-200 text-sm font-medium"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2"
                >
                  {saving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación de eliminación flotante */}
      {openDelete && deleteUserId && (
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
                      ¿Eliminar usuario?
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
                  Esta acción eliminará el usuario <span className="font-semibold">{users.find(u => String(u.id) === deleteUserId)?.firstName} {users.find(u => String(u.id) === deleteUserId)?.lastName}</span> solo de la base de datos local.
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
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                {isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}