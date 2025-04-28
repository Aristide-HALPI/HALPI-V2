// Type definitions for File constructor
interface FileConstructor {
  new(bits: BlobPart[], name: string, options?: FilePropertyBag): File;
  readonly prototype: File;
}

declare let File: FileConstructor;
