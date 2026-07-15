import type { DocumentType, Prisma } from '@prisma/client';

export class ProfileUpdateBuilder {
  private data: Prisma.ProfilesUpdateInput = {};

  withPhone(phone?: string): this {
    if (phone) this.data.phone = phone;
    return this;
  }

  withDocumentType(documentType?: DocumentType): this {
    if (documentType) this.data.documentType = documentType;
    return this;
  }

  withPhoto(photoUrl?: string): this {
    if (photoUrl) this.data.photo = photoUrl;
    return this;
  }

  isEmpty(): boolean {
    return Object.keys(this.data).length === 0;
  }

  build(): Prisma.ProfilesUpdateInput {
    return this.data;
  }
}
