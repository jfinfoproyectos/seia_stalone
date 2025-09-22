const fs = require('fs');
const path = require('path');

// Lista de archivos de servicios de Gemini a actualizar
const geminiServices = [
  'src/lib/gemini-audio-evaluation.ts',
  'src/lib/gemini-checklist-generator.ts',
  'src/lib/gemini-github-evaluation.ts',
  'src/lib/gemini-mermaid-generator.ts',
  'src/lib/gemini-prompt-generator.ts',
  'src/lib/gemini-quick-notes.ts',
  'src/lib/gemini-repository-analyzer.ts',
  'src/lib/gemini-rubric-generator.ts',
  'src/lib/gemini-schedule-analysis.ts',
  'src/lib/gemini-translate-service.ts',
  'src/lib/gemini-tts-service.ts',
  'src/lib/gemini-tutorial-generator.ts'
];

function updateGeminiService(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remover import de getApiKey
    content = content.replace(/import { getApiKey } from ['"]\.\/apiKeyService['"];?\n?/g, '');
    
    // Reemplazar llamadas a getApiKey() con verificación de parámetro
    content = content.replace(
      /const apiKey = await getApiKey\(\);/g,
      `if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }`
    );
    
    // Reemplazar llamadas a getApiKey(evaluationId) con verificación de parámetro
    content = content.replace(
      /const apiKey = await getApiKey\([^)]+\);/g,
      `if (!apiKey) {
      throw new Error('API Key de Gemini es requerida');
    }`
    );
    
    // Agregar parámetro apiKey a las funciones exportadas
    // Buscar funciones que usan getApiKey y agregar el parámetro
    const functionRegex = /export async function ([^(]+)\(([^)]*)\): Promise<[^>]+> {/g;
    content = content.replace(functionRegex, (match, functionName, params) => {
      // Si la función ya tiene apiKey como parámetro, no modificar
      if (params.includes('apiKey')) {
        return match;
      }
      
      // Agregar apiKey como último parámetro
      const newParams = params.trim() ? `${params}, apiKey?: string` : 'apiKey?: string';
      return `export async function ${functionName}(${newParams}): Promise<${match.split('Promise<')[1]}`;
    });
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Actualizado: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error actualizando ${filePath}:`, error.message);
  }
}

// Ejecutar actualización para todos los servicios
console.log('🚀 Iniciando actualización de servicios de Gemini...\n');

geminiServices.forEach(updateGeminiService);

console.log('\n✨ Actualización completada!');
console.log('\n📝 Notas importantes:');
console.log('- Revisa manualmente cada archivo para verificar que los cambios son correctos');
console.log('- Algunos archivos pueden necesitar ajustes adicionales en los parámetros de función');
console.log('- Actualiza las llamadas a estas funciones en el resto de la aplicación');