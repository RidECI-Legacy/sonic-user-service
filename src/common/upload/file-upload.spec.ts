import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  DOCUMENT_UPLOAD_OPTIONS,
  IMAGE_UPLOAD_OPTIONS,
  MAX_FILE_SIZE_BYTES,
  extensionForMimetype,
} from './file-upload';

/** Invoca el fileFilter y devuelve los argumentos con que llamó al callback. */
function runFilter(
  options: MulterOptions,
  mimetype: string,
): { error: Error | null; accepted: boolean } {
  let captured: { error: Error | null; accepted: boolean } = {
    error: null,
    accepted: false,
  };
  options.fileFilter!({}, { mimetype } as never, (error, acceptFile) => {
    captured = { error, accepted: acceptFile };
  });
  return captured;
}

describe('file-upload', () => {
  describe('extensionForMimetype', () => {
    it('maps known mimetypes to canonical extensions', () => {
      expect(extensionForMimetype('image/jpeg')).toBe('jpg');
      expect(extensionForMimetype('image/png')).toBe('png');
      expect(extensionForMimetype('application/pdf')).toBe('pdf');
    });

    it('falls back to bin for unknown mimetypes', () => {
      expect(extensionForMimetype('text/html')).toBe('bin');
    });
  });

  describe('IMAGE_UPLOAD_OPTIONS', () => {
    it('caps file size and number of files', () => {
      expect(IMAGE_UPLOAD_OPTIONS.limits).toEqual({
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
      });
    });

    it('accepts images', () => {
      const { error, accepted } = runFilter(IMAGE_UPLOAD_OPTIONS, 'image/png');
      expect(error).toBeNull();
      expect(accepted).toBe(true);
    });

    it('rejects pdf and other non-image types', () => {
      for (const mimetype of ['application/pdf', 'text/html']) {
        const { error, accepted } = runFilter(IMAGE_UPLOAD_OPTIONS, mimetype);
        expect(error).toBeInstanceOf(BadRequestException);
        expect(accepted).toBe(false);
      }
    });
  });

  describe('DOCUMENT_UPLOAD_OPTIONS', () => {
    it('allows up to two files', () => {
      expect(DOCUMENT_UPLOAD_OPTIONS.limits).toEqual({
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 2,
      });
    });

    it('accepts images and pdf', () => {
      for (const mimetype of ['image/jpeg', 'application/pdf']) {
        const { error, accepted } = runFilter(
          DOCUMENT_UPLOAD_OPTIONS,
          mimetype,
        );
        expect(error).toBeNull();
        expect(accepted).toBe(true);
      }
    });

    it('rejects executables and other types', () => {
      const { error, accepted } = runFilter(
        DOCUMENT_UPLOAD_OPTIONS,
        'application/x-msdownload',
      );
      expect(error).toBeInstanceOf(BadRequestException);
      expect(accepted).toBe(false);
    });
  });
});
