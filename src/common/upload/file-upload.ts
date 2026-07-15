import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/** Tamaño máximo por archivo. Evita que un upload gigante agote la memoria. */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Mapa mimetype permitido -> extensión canónica. La extensión se deriva del
 * mimetype validado, nunca del `originalname` del cliente (evita path traversal
 * y content-type spoofing como subir un .html a un bucket).
 */
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const DOCUMENT_EXTENSIONS: Record<string, string> = {
  ...IMAGE_EXTENSIONS,
  'application/pdf': 'pdf',
};

function buildUploadOptions(
  allowed: Record<string, string>,
  maxFiles: number,
): MulterOptions {
  return {
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: maxFiles },
    fileFilter: (_req, file, callback) => {
      if (allowed[file.mimetype]) {
        callback(null, true);
      } else {
        callback(
          new BadRequestException(
            `Tipo de archivo no permitido: ${file.mimetype}`,
          ),
          false,
        );
      }
    },
  };
}

/** Solo imágenes, un archivo (fotos de perfil). */
export const IMAGE_UPLOAD_OPTIONS = buildUploadOptions(IMAGE_EXTENSIONS, 1);

/** Imágenes o PDF, hasta dos archivos (licencia + seguro). */
export const DOCUMENT_UPLOAD_OPTIONS = buildUploadOptions(
  DOCUMENT_EXTENSIONS,
  2,
);

/**
 * Extensión segura a partir del mimetype ya validado por `fileFilter`.
 * `bin` es un fallback defensivo que en la práctica no debería alcanzarse.
 */
export function extensionForMimetype(mimetype: string): string {
  return DOCUMENT_EXTENSIONS[mimetype] ?? 'bin';
}
