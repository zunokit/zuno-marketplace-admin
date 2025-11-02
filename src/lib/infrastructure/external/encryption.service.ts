import { encrypt, decrypt, generateSecureId } from "@/lib/crypto";
import type { IEncryptionService } from "@/lib/core/domain/interfaces/encryption.service.interface";

export class EncryptionService implements IEncryptionService {
  encrypt(data: string): string {
    return encrypt(data);
  }

  decrypt(data: string): string {
    return decrypt(data);
  }

  generateSecureId(): string {
    return generateSecureId();
  }
}
