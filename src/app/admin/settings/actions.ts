'use server';

import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

// Funciones removidas: getGlobalSettings y updateGlobalApiKey
// El modelo globalSettings no existe en el esquema actual de Prisma
// La configuración global de API keys debe implementarse de otra manera

export async function getGlobalSettings() {
  // Retorna null ya que no hay configuración global en el esquema actual
  return null;
}

export async function updateGlobalApiKey(apiKey: string) {
  // No se puede actualizar ya que no existe el modelo globalSettings
  // Esta funcionalidad debe implementarse de otra manera
  revalidatePath('/admin/settings');
}

// Funciones removidas: updateUserApiKey y updateUserUseGlobalKey
// Estos campos no existen en el esquema actual de User
// Todas las API keys se manejan a nivel global